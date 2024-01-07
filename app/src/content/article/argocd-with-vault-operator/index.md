---
title: "ArgoCDとHashicorp Vaultに入門してみる"
createdAt: "2024-01-07"
emoji: "🐙"
category: "tech"
tags:
  - kubernetes
---

## はじめに

[Misskey インスタンスを立てたのですが](/articles/personal-misskey-server-on-home-kubernetes)ときどき kubernetes を破壊してしまうことがあり、そのたびに手動で`kubectl apply`や`helm install`などを実行して再インストールしていました。
これがかなり手間だったのですが最近[ArgoCD](https://argo-cd.readthedocs.io/en/stable/)の存在を知り、これを使うことで面倒を減らせると思いチュートリアルをやっていました。
最終的な構成は、ArgoCD + Vault + Vault Secrets Operator です。

作業したリポジトリは以下から確認できます

https://github.com/tunamaguro/try-argocd

## ArgoCD インストール

> 適当なクラスタを事前に立ち上げておいてください。私は kind を使いました

インストールは`Helm`を利用して行いました。ほかに`kubectl apply`する方法もありますが単純に面倒だったので`Helm`を使っています。

```bash
helm repo add argo https://argoproj.github.io/argo-helm
helm install argocd argo/argo-cd -n argocd --create-namespace -v argocd/values.yaml
```

Ref

- https://argo-cd.readthedocs.io/en/stable/getting_started/
- https://github.com/argoproj/argo-helm

とくに深い理由はないのですが[こちら](https://github.com/argoproj/argo-helm/tree/main/charts/argo-cd)に記載のある、HA モードで動かします

その後。チュートリアルにあるアプリケーションをデプロイして、動作しているかどうか確かめます

```bash
kubectl apply -f guestbook
kubectl port-forward service/argocd-server -n argocd 8080:443
```

```bash
kubectl -n argocd get secrets argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 --decode
argocd login localhost:8080 # user=admin password=上で確認した値
argocd app sync argocd/guestbook
```

## Hashicorp Vault のインストール

https://developer.hashicorp.com/vault/tutorials/kubernetes/kubernetes-minikube-raft

ArgoCD を使う際の問題の 1 つに Secret があります。よく言われていることですが Secret は単純に base64 でエンコードされているだけなので、これを GitHub などに置くと機密情報が漏洩します。
私の浅い知識で知っている解決策は以下の 2 つです。

1. 外部の機密管理の仕組みを利用する(e.g [External Secrets](https://external-secrets.io/latest/))
2. Secret 自体を暗号化する(e.g [Seald Secrets](https://github.com/bitnami-labs/sealed-secrets))

暗号化されたとしても GitHub に Secret を置きたくなかったので 1 番の方法を試します。今回は機密管理ツールとして`Hashicorp Vault`を利用します

[チュートリアル](https://developer.hashicorp.com/vault/tutorials/kubernetes/kubernetes-minikube-raft)を参考にマニフェストを作成します

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: vault
  namespace: argocd
spec:
  project: default
  source:
    helm:
      valuesObject:
        injector:
          enabled: false
        server:
          affinity: ""
          ha:
            enabled: true
            raft:
              enabled: true
    chart: vault
    repoURL: https://helm.releases.hashicorp.com
    targetRevision: 0.27.0
  destination:
    server: "https://kubernetes.default.svc"
    namespace: vault
  syncPolicy:
    syncOptions:
      - CreateNamespace=true
```

https://github.com/tunamaguro/try-argocd/blob/4dec56ca00be2c4d77c6293bb620ab06e81864da/vault/application.yaml

> Vault を機密管理ツールとして使うだけなので、Injector はなしにしてあります

次に暗号化に使う鍵を生成して初期化します。

```bash
kubectl -n vault exec -it pods/vault-0 -- vault operator init \
    -key-shares=1 \
    -key-threshold=1 \
    -format=json > cluster-keys.json
```

`--key-shares`がマスタキーの分割数、`key-threshold`が分割されたキー何個で複合できるかどうからしいです。デフォルトだと分割数が 5 で複合に必要な数は 3 個のはずです。  
https://developer.hashicorp.com/vault/docs/commands/operator/init

実際に生成されたキーは次のような形です

```json
{
  "unseal_keys_b64": ["BzSS28Rw+5I8spE7uXbJ3Yo4eODkanY031/O2kV1yoY="],
  "unseal_keys_hex": [
    "073492dbc470fb923cb2913bb976c9dd8a3878e0e46a7634df5fceda4575ca86"
  ],
  "unseal_shares": 1,
  "unseal_threshold": 1,
  "recovery_keys_b64": [],
  "recovery_keys_hex": [],
  "recovery_keys_shares": 0,
  "recovery_keys_threshold": 0,
  "root_token": "hvs.MT0LzT3HrDAMYmouKMrw7LE5"
}
```

開封処理を行うと Sealed が false になっているはずです。

```bash
kubectl -n vault exec -it pods/vault-0  -- vault operator unseal BzSS28Rw+5I8spE7uXbJ3Yo4eODkanY031/O2kV1yoY= # unseal_keys_b64の値を指定する
```

出力内の`Sealed`が false になるまで繰り返します

```bash
Key             Value
---             -----
Seal Type       shamir
Initialized     true
Sealed          false  # ここ
Total Shares    1
Threshold       1
Version         1.15.2
Build Date      2023-11-06T11:33:28Z
Storage Type    file
Cluster Name    vault-cluster-516e83d9
Cluster ID      01f71d1b-1faf-e74f-3cb2-753e1eeb473b
HA Enabled      true
```

他のポッドをクラスターに参加させつつ開封処理を繰り返します

```bash
# Raft ? のクラスターに参加させる
kubectl exec -ti vault-1 -- vault operator raft join http://vault-0.vault-internal:8200
kubectl exec -ti vault-2 -- vault operator raft join http://vault-0.vault-internal:8200
# 開封処理
kubectl -n vault exec -it pods/vault-1  -- vault operator unseal BzSS28Rw+5I8spE7uXbJ3Yo4eODkanY031/O2kV1yoY=
kubectl -n vault exec -it pods/vault-2  -- vault operator unseal BzSS28Rw+5I8spE7uXbJ3Yo4eODkanY031/O2kV1yoY=
```

各ポッドのステータスが Running になれば終了です

## Vault Secrets Operator のインストール

https://developer.hashicorp.com/vault/tutorials/kubernetes/vault-secrets-operator

当初は前述の External Secret を使うつもりでしたが vault 公式の Operator があるらしいのでこちらを試します

vault で kubernetes 認証を有効化します。これを使うと ServiceAccount と vault の権限管理を連携できるらしいです

```bash
kubectl -n vault exec -it pods/vault-0 -- /bin/sh
vault login
vault auth enable -path demo-auth-mount kubernetes
vault write auth/demo-auth-mount/config \ kubernetes_host="https://$KUBERNETES_PORT_443_TCP_ADDR:443"
```

key-value エンジンを追加します

```bash
vault secrets enable -path=kvv2 kv-v2
```

先ほど作成した`kvv2`以下で読み込みのみが可能なポリシーを作成する

```bash
vault policy write dev - <<EOF path "kvv2/*" { capabilities = ["read"] } EOF
```

ポリシーとサービスアカウントを紐づける。今回の場合`app`名前空間の`deafault`サービスアカウントに`dev`ポリシーを割り当てるという形のはずです。
残りの`audience`はドキュメントを確認したんですが、何を設定しているのかよくわかっていません。詳しい人がいれば教えてください

https://developer.hashicorp.com/vault/api-docs/auth/kubernetes

```bash
vault write auth/demo-auth-mount/role/role1 \ bound_service_account_names=default \ bound_service_account_namespaces=app \ policies=dev \ audience=vault \ ttl=24h
```

シークレットを作成します

```bash
vault kv put kvv2/webapp/config username="static-user" password="static-password"
```

ようやく Operator をデプロイします

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: vault-secrets-operator
  namespace: argocd
spec:
  project: default
  source:
    helm:
      valuesObject:
        defaultVaultConnection:
          enabled: true
          address: "http://vault.vault.svc.cluster.local:8200"
          skipTLSVerify: false
        controller:
          manager:
            clientCache:
              persistenceModel: direct-encrypted
              storageEncryption:
                enabled: true
                mount: demo-auth-mount
                keyName: vso-client-cache
                transitMount: demo-transit
                kubernetes:
                  role: auth-role-operator
                  serviceAccount: demo-operator
    chart: vault-secrets-operator
    repoURL: https://helm.releases.hashicorp.com
    targetRevision: 0.4.2
  destination:
    server: "https://kubernetes.default.svc"
    namespace: vault-secrets-operator-system
  syncPolicy:
    syncOptions:
      - CreateNamespace=true
```

## Secret を作る

> 軽くドキュメントを読んだだけなので間違っているかもしれません

どの vault に接続するかを示す`VaultConnection`と認証情報を示す`VaultAuth`を組み合わせて Secret を作成します。

というわけで用意されているマニフェストを`apply`します

```bash
kubectl apply -f learn-vault-secrets-operator/vault/vault-auth-static.yaml
kubectl apply -f learn-vault-secrets-operator/vault/static-secret.yaml
```

すると Secret が増えているはずです

```bash
kubectl get secrets -n app
NAME       TYPE     DATA   AGE
secretkv   Opaque   3      39s
```

```bash
kubectl get secrets -n app secretkv -o yaml
apiVersion: v1
data:
  _raw: eyJkYXRhIjp7InBhc3N3b3JkIjoic3RhdGljLXBhc3N3b3JkIiwidXNlcm5hbWUiOiJzdGF0aWMtdXNlciJ9LCJtZXRhZGF0YSI6eyJjcmVhdGVkX3RpbWUiOiIyMDI0LTAxLTA1VDE5OjU3OjQ5Ljc0NDAyNTYxWiIsImN1c3RvbV9tZXRhZGF0YSI6bnVsbCwiZGVsZXRpb25fdGltZSI6IiIsImRlc3Ryb3llZCI6ZmFsc2UsInZlcnNpb24iOjF9fQ==
  password: c3RhdGljLXBhc3N3b3Jk
  username: c3RhdGljLXVzZXI=
kind: Secret
(snip)
```

`_raw`には base64 エンコードされたデータが格納されていました。

```bash
echo eyJkYXRhIjp7InBhc3N3b3JkIjoic3RhdGljLXBhc3N3b3JkIiwidXNlcm5hbWUiOiJzdGF0aWMtdXNlciJ9LCJtZXRhZGF0YSI6eyJjcmVhdGVkX3RpbWUiOiIyMDI0LTAxLTA1VDE5OjU3OjQ5Ljc0NDAyNTYxWiIsImN1c3RvbV9tZXRhZGF0YSI6bnVsbCwiZGVsZXRpb25fdGltZSI6IiIsImRlc3Ryb3llZCI6ZmFsc2UsInZlcnNpb2
4iOjF9fQ== | base64 --decode > secret.json
```

```json
{
  "data": { "password": "static-password", "username": "static-user" },
  "metadata": {
    "created_time": "2024-01-05T19:57:49.74402561Z",
    "custom_metadata": null,
    "deletion_time": "",
    "destroyed": false,
    "version": 1
  }
}
```

vault に格納されている値を更新すると Secret も更新されます

```bash
vault kv put kvv2/webapp/config username="static-user2" password="static-password2"
```

おそらくこれの更新頻度は`refreshAfter`で制御できるはずです

```yaml
apiVersion: secrets.hashicorp.com/v1beta1
kind: VaultStaticSecret
metadata:
  name: vault-kv-app
  namespace: app
spec:
(snip)

  # dest k8s secret
  destination:
    name: secretkv
    create: true

  # static secret refresh interval
  refreshAfter: 30s

  # Name of the CRD to authenticate to Vault
  vaultAuthRef: static-auth
```

## おわりに

この後`VaultDynamicSecret`を検証して、vault の値が更新されるたびに Secret を利用しているポッドが更新されることを確認しましたが、書く元気がなくなったのでここで終わります(現在時刻 00:03)。

試してみた感想として Vault はかなり直感的に扱えるのでそこは素晴らしいと感じました。ただ、Vault を再起動するたびに`unseal`や、クラスターへの参加を毎回手動で行う必要があるのがかなりつらそうです。
実際のところ、自動で unseal する`auto-unseal`や`auto-join`はあるらしいのでこれらを利用すれば、ArgoCD をデプロイ後マニフェストを`apply`するだけで Secret を扱う基盤構築ができるかもしれません。

- Auto unseal
  - https://developer.hashicorp.com/vault/tutorials/auto-unseal
- Auto join
  - https://developer.hashicorp.com/vault/tutorials/raft/raft-storage-aws#cloud-auto-join
  - そもそも Raft を使わないという択でも良いかもしれない

これらを試してみたらまた記事にしたいと思います
