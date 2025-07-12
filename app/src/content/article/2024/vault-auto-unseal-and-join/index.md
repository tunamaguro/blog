---
title: "Hashicorp Vaultのauto-joinとauto-unsealを試す"
createdAt: "2024-01-13"
emoji: "🔑"
category: "tech"
tags:
  - kubernetes
---

## はじめに

[前回の記事](/articles/20240107-ArgoCDとHashicorp%20Vaultに入門してみる)で気になっていた Vault の`auto-unseal`と`auto-join`について、実際に試してみた記録です。今回試してみたリポジトリはこちら

https://github.com/tunamaguro/try-vault-heal-join

> この例ではすぐに環境を壊しているので機密情報を含むデータを掲載していますが、実際に行われる場合は慎重に扱ってください。  
> また、掲載するデータには注意をしているつもりですが、もし載せてはいけない情報が書いてあった場合、Twitter の DM などでこっそり教えていただけると助かります。

## auto-unseal を有効化する

とりあえず公式ドキュメントを読みます。

https://developer.hashicorp.com/vault/docs/configuration/seal

ざっくり読んだ感じ AWS や GCP,Azure の暗号化キー管理サービスを暗号化に用いることで、面倒だった`unseal`を省いてくれるらしいです。
なので、事前に各サービスで鍵を生成しておく必要があります。今回は安いという理由で GCP を利用しました。

適当なプロジェクトを作成した後、[GCP での unseal](https://developer.hashicorp.com/vault/tutorials/auto-unseal/autounseal-gcp-kms)チュートリアルを参考に
サービスアカウントを作成します。今回は次の権限を与えて作成しました。  
![サービスアカウントのロール](src/assets/images/vault-auto-unseal-and-join/sa-role.png)

このサービスアカウントを利用するための鍵を`credentials.json`という名前でダウンロードしておきます

![サービスアカウント鍵のダウンロード](src/assets/images/vault-auto-unseal-and-join/credential.png)

次にキーリングを作成します。GCP を全然触ったことがないのでよくわかっていませんが、暗号化に利用する鍵をまとめて管理するための何かだと思っています。
リージョンについてもここを変えると何が変わるのか分かっていませんが、チュートリアル見た感じ global で作られている風だったので揃えました

https://github.com/hashicorp/vault-guides/blob/87f2fe347b581ad46e2e0a4b8a540f227cecb4f5/operations/gcp-kms-unseal/variables.tf#L31-L33

![キーリング作成](src/assets/images/vault-auto-unseal-and-join/keyring.png)

その後鍵を作成します
![鍵作成](src/assets/images/vault-auto-unseal-and-join/unseal-key.png)

ここまでで GCP での作業は終了して、kubernetes での作業に移ります。先ほどダウンロードした`credentials.json`を Secret として作成します

```bash
kubectl create ns vault
kubectl create secret generic gcp-kms-sa --from-file=credentials.json -n vault
```

こんな感じのシークレットができるはずです

```yaml
apiVersion: v1
data:
  credentials.json: key
kind: Secret
metadata:
  creationTimestamp: null
  name: gcp-kms-sa
  namespace: vault
```

その後この認証ファイルを vault がマウントして利用できるように設定ファイルを書き換えます。
ドキュメントを読む限りすべての設定値は環境変数に設定すれば良さそうなので、セキュリティを考えるなら Secret から利用したほうがよいと思います

https://developer.hashicorp.com/vault/docs/configuration/seal/gcpckms#gcpckms-parameters

```yaml
injector:
  enabled: false
server:
  enabled: true
  affinity: ""
  standalone:
    enabled: true
    config: |
      ui = true
      listener "tcp" {
        tls_disable = 1
        address = "[::]:8200"
        cluster_address = "[::]:8201"
        # Enable unauthenticated metrics access (necessary for Prometheus Operator)
        #telemetry {
        #  unauthenticated_metrics_access = "true"
        #}
      }
      storage "file" {
        path = "/vault/data"
      }
      seal "gcpckms" {
        credentials = "/vault/userconfig/credentials.json"
        project     = "test-vault-auto-unseal"
        region      = "global"
        key_ring    = "vault-auto-unseal"
        crypto_key  = "unseal-key"
      }
  # https://github.com/hashicorp/vault-helm/blob/main/values.yaml#L592-L605
  volumes:
    - name: gcp-creds
      secret:
        secretName: gcp-kms-sa
  volumeMounts:
    - name: gcp-creds
      readOnly: true
      mountPath: /vault/userconfig
```

[作業コミット](https://github.com/tunamaguro/try-vault-heal-join/commit/0a83a3f82ea0e3231bcd194fe013f39cfe68c6ba#diff-ce9456e5067b90f33aeddca4cdce2f3c769350c9cb2e72b37fb86853570e62cdR10-R40)

これを`argocd sync`するとポッドが作成はされますが Ready にはまだなりません。チュートリアルにも記載がありましたが、はじめの`operator init`だけは手動で行う必要があるようです

![ArgoCD上での表示](src/assets/images/vault-auto-unseal-and-join/argocd-vault-sync-unseal-before-init.png)

```bash
kubectl get pod -n vault
NAME      READY   STATUS    RESTARTS   AGE
vault-0   0/1     Running   0          20s
```

初期化を行います

```bash
kubectl -n vault exec -it vault-0 -- vault operator init
Recovery Key 1: fV8mxmHf3BqcAA/xhxRaX+WfkKChTY1Fqi9ECymPISwe
Recovery Key 2: T8Ilnd28apSs7teRfVlaUJwBQLrKp/Cii67tI5V5B41/
Recovery Key 3: stQAoWyK0bsZWDShSMzmO8ioSw7ZDLthLKHMLFytdDHS
Recovery Key 4: uHonbQLQY4hhS1K3vxtA7pxzwKE/lsmf7IReX5V0j/zE
Recovery Key 5: hIYKIAjTmxD7RxhPwoAXq/QGWJNMF2lgGsQ05srC6Dsd

Initial Root Token: hvs.cZIXK5JkorY2X3Bua2hFu4SU

Success! Vault is initialized

Recovery key initialized with 5 key shares and a key threshold of 3. Please
securely distribute the key shares printed above.
```

状態を確認すると`vault operator unseal`しないと True のままだった Sealed が、何もしなくても False になっています

```bash
kubectl -n vault exec -it vault-0 -- vault status
Key                      Value
---                      -----
Recovery Seal Type       shamir
Initialized              true
Sealed                   false
Total Recovery Shares    5
Threshold                3
Version                  1.15.2
Build Date               2023-11-06T11:33:28Z
Storage Type             file
Cluster Name             vault-cluster-07b4349e
Cluster ID               2d16b1bd-6586-68f3-8a0d-70d78b32db1f
HA Enabled               false
```

## auto-join を有効にする

https://developer.hashicorp.com/vault/tutorials/raft/raft-storage#retry-join

HA 化した際のストレージとして Raft を用いる場合、各ポッドで`vault operator raft join`を実行しないといけませんでした。ポッドが落ちるたびにこんなことをやりたくないので、自動で Raft クラスターに接続してもらうように設定します。
ドキュメントによると、`retry_join`に接続先サーバのアドレスを書けば良さそうなので設定を追加します

```yaml
server:
  ha:
    enabled: true
    replicas: 3
    raft:
      enabled: true
      config: |
        ui = true

        listener "tcp" {
          tls_disable = 1
          address = "[::]:8200"
          cluster_address = "[::]:8201"
          # Enable unauthenticated metrics access (necessary for Prometheus Operator)
          #telemetry {
          #  unauthenticated_metrics_access = "true"
          #}
        }

        storage "raft" {
          path = "/vault/data"
          retry_join {
            leader_api_addr = "http://vault-0.vault-internal:8200"
          }
          retry_join {
            leader_api_addr = "http://vault-1.vault-internal:8200"
          }
          retry_join {
            leader_api_addr = "http://vault-2.vault-internal:8200"
          }
        }

        seal "gcpckms" {
          credentials = "/vault/userconfig/credentials.json"
          project     = "test-vault-auto-unseal"
          region      = "global"
          key_ring    = "vault-auto-unseal"
          crypto_key  = "unseal-key"
        }

        service_registration "kubernetes" {}
```

[作業コミット](https://github.com/tunamaguro/try-vault-heal-join/commit/02d6d27f9a3206d5181c0ce676ed48702b5a9a31#diff-ce9456e5067b90f33aeddca4cdce2f3c769350c9cb2e72b37fb86853570e62cdR26-R57)

raft.enabled を true にしないとうまく動かなかったので注意。config も raft の下のものに書く必要がありました。~ここでしばらく沼にはまり 30 分程度ムダにしました。皆さんは Helm の説明をよく読みましょう~

これをデプロイすると下のようになります。意図通り 3 個ポッドがあり HA 用の設定になっているようです

![ArgoCD上での表示](src/assets/images/vault-auto-unseal-and-join/argocd-vault-sync-auto-join.png)

例によって初期化はまだされていないので、`vault operator init`します

```bash
kubectl -n vault exec -it vault-0 -- vault operator init
Recovery Key 1: mOOF7BS2/8RQkT46padw9+Rpm28BzS1f0fH3fsLWCagd
Recovery Key 2: VsIULAhtLJ5lVd7RiuiaHUWetXzBnBVm0uBuJwuYZsaP
Recovery Key 3: umJeEcI+9uvsCakwns21KSOW3bkoo2zYoa+ZMca85hap
Recovery Key 4: 00UezpLDHNmstgTkrge8RmCEDae3N6fsTPBjy5GNMjWg
Recovery Key 5: micAIuoSedL/gkDo3gZX9pediYm6nxF9x87wX/LRCd1r

Initial Root Token: hvs.KIi1gwnfMWYdOhuMrOpSbA2M

Success! Vault is initialized

Recovery key initialized with 5 key shares and a key threshold of 3. Please
securely distribute the key shares printed above.
```

```bash
kubectl -n vault exec -it vault-0 -- vault status
Key                      Value
---                      -----
Recovery Seal Type       shamir
Initialized              true
Sealed                   false
Total Recovery Shares    5
Threshold                3
Version                  1.15.2
Build Date               2023-11-06T11:33:28Z
Storage Type             raft
Cluster Name             vault-cluster-69bba5ea
Cluster ID               7bc17321-5c56-6dbc-c906-ab5937bfe5e1
HA Enabled               true
HA Cluster               https://vault-0.vault-internal:8201
HA Mode                  active
Active Since             2024-01-12T14:44:42.866364051Z
Raft Committed Index     61
Raft Applied Index       61
```

`vault-0`の初期化は無事完了し、auto-unseal まで行われたことが確認できます。ほかのポッドも同じようになっているか確認します

```bash
kubectl -n vault exec -it vault-1 -- vault status
Key                      Value
---                      -----
Recovery Seal Type       shamir
Initialized              true
Sealed                   false
Total Recovery Shares    5
Threshold                3
Version                  1.15.2
Build Date               2023-11-06T11:33:28Z
Storage Type             raft
Cluster Name             vault-cluster-69bba5ea
Cluster ID               7bc17321-5c56-6dbc-c906-ab5937bfe5e1
HA Enabled               true
HA Cluster               https://vault-0.vault-internal:8201
HA Mode                  standby
Active Node Address      http://10.244.3.11:8200
Raft Committed Index     63
Raft Applied Index       63
```

```bash
kubectl -n vault exec -it vault-2 -- vault status
Key                      Value
---                      -----
Recovery Seal Type       shamir
Initialized              true
Sealed                   false
Total Recovery Shares    5
Threshold                3
Version                  1.15.2
Build Date               2023-11-06T11:33:28Z
Storage Type             raft
Cluster Name             vault-cluster-69bba5ea
Cluster ID               7bc17321-5c56-6dbc-c906-ab5937bfe5e1
HA Enabled               true
HA Cluster               https://vault-0.vault-internal:8201
HA Mode                  standby
Active Node Address      http://10.244.3.11:8200
Raft Committed Index     64
Raft Applied Index       64
```

どのポッドも初期化が完了し vault クラスターが動き始めました

![初期化後のArgoCD](src/assets/images/vault-auto-unseal-and-join/argocd-vault-sync-after-init.png)

一応 CLI 上でも確認しておきます

```bash
vault login
vault operator raft list-peers
Node                                    Address                        State       Voter
----                                    -------                        -----       -----
01b0c5aa-a16f-8bbf-9e02-082e1fa55432    vault-0.vault-internal:8201    leader      true
b4292c3d-7127-7272-38bd-8a3e682d61dc    vault-2.vault-internal:8201    follower    true
c6ea822c-1d43-3c0b-9932-dac4465574a6    vault-1.vault-internal:8201    follower    true
```

## 後片付け

作製した kubernetes クラスターと GCP 上のリソースは忘れないうちに消しておきましょう

```bash
kind delete clusters vault-test
Deleted nodes: ["vault-test-control-plane" "vault-test-worker" "vault-test-worker3" "vault-test-worker2"]
Deleted clusters: ["vault-test"]
```

![GCPリソースの削除](src/assets/images/vault-auto-unseal-and-join/delete-gcp-project.png)

## 後書き

`auto-unseal`と`auto-join`を設定しておけば、簡単に秘密鍵を管理する基盤をお家 kubernetes 上に構築できそうでした。
とくに今回で一番面倒だったのは、GCP プロジェクト作成~キーリング作成あたりなので、ここら辺を Terraform を使って自動化できれば、
お家 kubernetes に簡単に導入することも夢じゃなさそうだと思います。今度はそれをやりながらお家 kubernetes の設定ファイルを公開する作業を進めたいです
