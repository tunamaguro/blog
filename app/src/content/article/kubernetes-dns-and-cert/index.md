---
title: "ExternalDNSとcert-managerでお家KubernetesとHTTPSな通信をする"
createdAt: "2023-07-02"
emoji: "🧾"
category: "tech"
tags:
  - kubernetes
  - Cloudflare
---

## はじめに

以前 kubespray を使ってお家 kubernetes を作成しました（[前回の記事](/articles/create-home-kubernates-with-kubespray)）。
その後遊んでいたのですが、`kubectl port-forward`を使って通信している現状を変え、
通常のサーバのように`hogohoge.your.domain`でアクセスできないかな~といろいろ試していた所、うまくいったのでその記録を残しておきたいと思います。

## 完成系

以下のようなリソースを作成すると自動的にドメインおよび TLS が設定され、`hogohoge.your.domain`と HTTPS 通信を行えるようになります。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ingress-helloworld
spec:
  selector:
    matchLabels:
      app: ingress-helloworld
  replicas: 1
  template:
    metadata:
      labels:
        app: ingress-helloworld
    spec:
      containers:
        - name: ingress-helloworld
          image: gcr.io/google-samples/hello-app:1.0
          ports:
            - containerPort: 8080
          resources:
            limits:
              cpu: 10m
              memory: 30Mi
            requests:
              cpu: 10m
              memory: 30Mi
---
apiVersion: v1
kind: Service
metadata:
  name: ingress-helloworld
  labels:
    app: ingress-helloworld
spec:
  ports:
    - port: 8080
      protocol: TCP
  selector:
    app: ingress-helloworld
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-helloworld
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-production
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - annotation.your.domain # あなたのドメインに書き換えてください
      secretName: nginx-annotation-tls
  rules:
    - host: annotation.your.domain # あなたのドメインに書き換えてください
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: ingress-helloworld
                port:
                  number: 8080
```

## MetalLB のインストール

[MetalLB, bare metal load-balancer for Kubernetes (universe.tf)](https://metallb.universe.tf/installation/)

まず`kubectl port-forward`を使わずともクラスター内のサービスと通信できるように、
MetalLB をインストールします。インストール方法はいろいろあるようですが今回は Helm を使ってインストールします。
ここでいろいろ追加されるので訳が分からなくなるのを防ぐために Namespace を分けておきます。

```bash
helm repo add metallb https://metallb.github.io/metallb
helm repo update
helm install metallb metallb/metallb -n  metallb-ns --create-namespace
```

続いて MetalLB が動作できるように設定を追加します。L2 モードと BGP モードというものがあるようなのですが、
私が BGP というものを詳しく知らないので L2 モードで設定してきます。

下のような設定ファイルを作成します。ただし`ip-address-pool.yaml`の spec.addresses は各自の環境に合わせて変更してください。
詳しくは以下リンクを確認お願いします。  
https://metallb.universe.tf/configuration/

- `ip-address-pool.yaml`

```yaml
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: primary
  namespace: metallb-ns
spec:
  addresses:
  - 192.168.1.200-192.168.1.254
```

- `l2-advetisement.yaml`

```yaml
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: l2-primary
  namespace: metallb-ns
spec:
  ipAddressPools:
    - primary
```

適当なサービスを作成して IPAddressPool に設定されたアドレスが割り当てられるかチェックします。

- `metallb.yaml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: sample-lb
spec:
  type: LoadBalancer
  ports:
    - port: 80
  selector: {}
```

```bash
kubectl apply -f metallb.yaml
kubectl get service sample-lb
```

```bash
NAME        TYPE           CLUSTER-IP      EXTERNAL-IP     PORT(S)        AGE
sample-lb   LoadBalancer   10.233.57.250   192.168.1.201   80:31052/TCP   27s
```

EXTERNAL-IP にアドレスが書いてあれば OK です。作成したサービスは片付けます。

```bash
kubectl delete -f metallb.yaml
```

## Ingress-Nginx Controller のインストール

[Installation Guide - Ingress-Nginx Controller (kubernetes.github.io)](https://kubernetes.github.io/ingress-nginx/deploy/)

ついでに L7 のロードバランサーも入れておきます。これも Helm を使ってインストールします。

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install ingress-nginx ingress-nginx/ingress-nginx -n ingress-nginx --create-namespace
```

インストールが完了したら動作しているか確かめるために、以下のようなリソースを作成します。

参考: [Minikube 上で NGINX Ingress コントローラーを使用して Ingress をセットアップする | Kubernetes](https://kubernetes.io/ja/docs/tasks/access-application-cluster/ingress-minikube/)

- `ingress-nginx.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ingress-helloworld
spec:
  selector:
    matchLabels:
      app: ingress-helloworld
  replicas: 1
  template:
    metadata:
      labels:
        app: ingress-helloworld
    spec:
      containers:
      - name: ingress-helloworld
        image: gcr.io/google-samples/hello-app:1.0
        ports:
        - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: ingress-helloworld
  labels:
    app: ingress-helloworld
spec:
  ports:
  - port: 8080
    protocol: TCP
  selector:
    app: ingress-helloworld
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-helloworld
spec:
  rules:
  - host: helloworld.info
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ingress-helloworld
            port:
              number: 8080
  ingressClassName: nginx
```

```bash
kubectl apply -f ingress-nginx.yaml
```

Ingress が作成されていることを確かめたら curl でアクセスします。HOSTS が設定されていればいけると思います。

```bash
kubectl get ingress
NAME                 CLASS   HOSTS             ADDRESS         PORTS   AGE
ingress-helloworld   nginx   helloworld.info   192.168.1.200   80      48s
```

```bash
curl -H 'Host:helloworld.info' 192.168.1.200
Hello, world!
Version: 1.0.0
Hostname: ingress-helloworld-7dcf585646-j7jct
```

ホストを設定せずにアクセスすると Not Found になるので L7 レベルで分散が行われているようです。

```bash
curl 192.168.1.200
<html>
<head><title>404 Not Found</title></head>
<body>
<center><h1>404 Not Found</h1></center>
<hr><center>nginx</center>
</body>
</html>
```

確認ができたら作成したリソースを片付けます。

```bash
kubectl delete -f ingress-nginx.yaml
```

## ExternalDNS

[kubernetes-sigs/external-dns: Configure external DNS servers (AWS Route53, Google CloudDNS and others) for Kubernetes Ingresses and Services (github.com)](https://github.com/kubernetes-sigs/external-dns)

先ほどまでで L2 および L7 での分散およびアクセスが行えるようになりましたが、いまだに IP アドレスを使わないといけません。
これはお洒落じゃないですね（圧）。そこでドメインを自動的に発行できるように ExternalDNS を利用します。

ExternalDNS は作成された Ingress や Service の情報を見て、いい感じに DNS レコードを作成してくれるツールです。
そのためここら先は各自がドメインを持っている必要があります。持っていない方は適当なドメインを作成しておいてください。

私は DNS Server として Cloudflare を利用しているので以下の手順に沿って行います。  
[external-dns/docs/tutorials/cloudflare.md at master · kubernetes-sigs/external-dns · GitHub](https://github.com/kubernetes-sigs/external-dns/blob/master/docs/tutorials/cloudflare.md)

その他対応しているプロバイダー一覧は以下です。  
[kubernetes-sigs/external-dns: Configure external DNS servers (AWS Route53, Google CloudDNS and others) for Kubernetes Ingresses and Services (github.com)](https://github.com/kubernetes-sigs/external-dns#status-of-providers)

### API トークン発行

はじめに Cloudflare の API を利用するための API トークンを発行します。下のページの Create Token をクリックしてください。

[API Tokens | Cloudflare](https://dash.cloudflare.com/profile/api-tokens)

なんかいっぱいありますが、一番下の Custom token を選択します。

![Custom Tokenを選択](/images/kubernetes-dns-and-cert/cloudflare-token-custom.png)

公式ドキュメントにあるようにいくつか権限を与えて作成します。

> When using API Token authentication, the token should be granted Zone Read, DNS Edit privileges, and access to All zones.

![ExternalDNS用トークン](/images/kubernetes-dns-and-cert/cloudflare-token-externaldns.png)

ここで作成されたトークンを忘れないようにメモしておきます。

### ExternalDNS デプロイ

続いて ExternalDNS をデプロイします。今回は以下のようなリソースを作成しました。Secret の部分は先ほど作成したトークンに置き換えてください。

- `external-dns.yaml`

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: external-dns
---
apiVersion: v1
kind: Secret
metadata:
  name: cloudflare-secret
  namespace: external-dns
data:
  # echo 'YourSecret' | base64
  token: YourToken
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: external-dns
  namespace: external-dns
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: external-dns
rules:
  - apiGroups: [""]
    resources: ["services", "endpoints", "pods"]
    verbs: ["get", "watch", "list"]
  - apiGroups: ["extensions", "networking.k8s.io"]
    resources: ["ingresses"]
    verbs: ["get", "watch", "list"]
  - apiGroups: [""]
    resources: ["nodes"]
    verbs: ["list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: external-dns-viewer
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: external-dns
subjects:
  - kind: ServiceAccount
    name: external-dns
    namespace: external-dns
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: external-dns
  namespace: external-dns
spec:
  replicas: 1
  strategy:
    type: Recreate
  selector:
    matchLabels:
      app: external-dns
  template:
    metadata:
      labels:
        app: external-dns
    spec:
      serviceAccountName: external-dns
      containers:
        - name: external-dns
          image: registry.k8s.io/external-dns/external-dns:v0.13.5
          args:
            - --log-level=info
            - --log-format=text
            - --source=service # ingress is also possible
            - --source=ingress
            - --policy=sync # ingressが消えた際にレコードを消してほしくない場合はupsert-onlyにする
            - --events
            - --interval=1m # より早く同期したい場合は10sなどにする
            - --domain-filter=YourDomain # (optional) limit to only example.com domains; change to match the zone created above.
            - --provider=cloudflare
            - --cloudflare-dns-records-per-page=5000 # (optional) configure how many DNS records to fetch per request
          livenessProbe:
            failureThreshold: 2
            httpGet:
              path: /healthz
              port: http
              scheme: HTTP
            initialDelaySeconds: 10
            periodSeconds: 10
            successThreshold: 1
            timeoutSeconds: 5
          resources:
            limits:
              cpu: 50m
              memory: 50Mi
            requests:
              cpu: 50m
              memory: 50Mi
          env:
            - name: CF_API_TOKEN
              valueFrom:
                secretKeyRef:
                  name: cloudflare-secret
                  key: token
```

```bash
kubectl apply -f external-dns.yaml
```

起動したかどうか確かめます。

```bash
kubectl get all -n external-dns
NAME                                READY   STATUS    RESTARTS   AGE
pod/external-dns-5855c77d8f-vnd62   1/1     Running   0          27s

NAME                           READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/external-dns   1/1     1            1           27s

NAME                                      DESIRED   CURRENT   READY   AGE
replicaset.apps/external-dns-5855c77d8f   1         1         1       27s
```

### 動作チェック

適当な Ingress を作成し記載したドメインが登録されるか調べます。

- `dns-sample.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  selector:
    matchLabels:
      app: nginx
  replicas: 3
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: docker.io/nginx:latest
          ports:
            - containerPort: 80
          resources:
            limits:
              cpu: 10m
              memory: 30Mi
            requests:
              cpu: 10m
              memory: 30Mi
---
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
  labels:
    app: nginx
spec:
  selector:
    app: nginx
  ports:
    - port: 80
      protocol: TCP
      name: http
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nginx-ingress
spec:
  ingressClassName: nginx
  rules:
    - host: nginx.your.domain
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: nginx-service
                port:
                  number: 80
```

```bash
kubectl apply -f dns-sample.yaml
```

1 分ほどすると DNS レコードが登録されているようなログが流れてきました。

```bash
kubectl logs -n external-dns deployments/external-dns -f
```

```bash
# 略
time="2023-07-02T07:33:33Z" level=info msg="Changing record." action=CREATE record=nginx.xxxx.xxxx ttl=1 type=A zone=xxxx
time="2023-07-02T07:33:34Z" level=info msg="Changing record." action=CREATE record=nginx.xxxx.xxxx ttl=1 type=TXT zone=xxxx
time="2023-07-02T07:33:34Z" level=info msg="Changing record." action=CREATE record=a-nginx.xxxx.xxxx ttl=1 type=TXT zone=xxxx
```

確認しに行くと確かに DNS レコードが増えていることが確認できます。

![DNSレコードが登録される](/images/kubernetes-dns-and-cert/cloudflare-dns-registered.png)

この状態で nginx.your.domain にアクセスすると Nginx の Welcome メッセージが表示されます。

![NginxのWelcomeメッセージ](/images/kubernetes-dns-and-cert/cloudflare-access-by-domain.png)

最後に作成した Ingress を削除し DNS レコードが削除されることを確かめます。

```bash
kubectl delete -f dns-sample.yaml
```

![DNSレコードが削除される](/images/kubernetes-dns-and-cert/cloudflare-dns-unregistered.png)

## cert-manager

先ほどまでで DNS レコードが自動で作成されるようになりました。かなりいい感じですね。
ですが、まだ TLS 証明書を発行していないため通信は暗号化されておらずセキュアな通信ではありません。
そこで証明書の発行や更新を自動で行ってくれる cert-manager を利用します。

[cert-manager - cert-manager Documentation](https://cert-manager.io/docs/)

かなり多くの認証局を利用できるようですが、無料で利用できる Let's Encrypt を使います。

### インストール

[Helm - cert-manager Documentation](https://cert-manager.io/docs/installation/helm/)

今回も Helm を使ってインストールします。CRD をインストールする方法として kubectl を使う方法もあるようですが、
`Recommended for ease of use & compatibility`と書かれている Helm を使う方法でいきます。
詳しくは上記のリンクを参照してください。

```bash
helm repo add jetstack https://charts.jetstack.io
helm repo update
helm install \
  cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true
```

2~3 分程かかったのでコーヒーなどを飲んでいるといいと思います。

### Issuer 作成

[Cloudflare - cert-manager Documentation](https://cert-manager.io/docs/configuration/acme/dns01/cloudflare/)

今回は先ほど作成した ExternalDNS と連携して TLS 証明書を発行するようにするため Cloudflare 用の設定を行います。
ExternalDNS と同じようにこちらもいくつか権限を与えて作成します。詳しくは上記ドキュメントを参照してください。

![cert-manager用トークン発行](/images/kubernetes-dns-and-cert/cloudflare-token-cert-manager.png)

先ほどメモしたトークンを使って以下のような`Issuer`を作成します。
`Issuer`は実際に証明書を発行するリソースで、これには`Issuer`と`ClusterIssuer`の 2 つがあります。
違いはネームスペースをまたいで利用できるかどうかです。普通の環境では`Issuer`を使うべきですが、
お家 kubernetes で私しか使わないため今回は`ClusterIssuer`にしています。

- `cluster-issuer.yaml`

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: cloudflare-secret
  namespace: cert-manager
data:
  # echo 'YourSecret' | base64
  token: YourToken
---
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
  namespace: cert-manager
spec:
  acme:
    email: YourEmail
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-staging-private-key
    solvers:
      - dns01:
          cloudflare:
            apiTokenSecretRef:
              name: cloudflare-secret
              key: token
---
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-production
  namespace: cert-manager
spec:
  acme:
    email: YourEmail
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-production-private-key
    solvers:
      - dns01:
          cloudflare:
            apiTokenSecretRef:
              name: cloudflare-secret
              key: token
```

`spec.acme.privateKeySecretRef`に指定した名前の Secret が作成されそこに TLS の秘密鍵が保存されるようです。
また、Let's Encrypt には制限が強い production と弱い staging の 2 つがあるので、それを使い分けられるように 2 つ`Issuer`を作成します。

- [NGINX イングレスのセキュリティ保護 - 証明書マネージャーのドキュメント (cert-manager.io)](https://cert-manager.io/docs/tutorials/acme/nginx-ingress/#step-5---deploy-cert-manager)
- [ステージング環境 - Let's Encrypt - フリーな SSL/TLS 証明書 (letsencrypt.org)](https://letsencrypt.org/ja/docs/staging-environment/)

これらのリソースを apply します。

```bash
kubectl apply -f cluster-issuer.yaml
```

## 動作チェック

最後に動作チェックします。すべての設定が完了したので一番初めに示したリソースを利用できるはずです。

- `cert-sample.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ingress-helloworld
spec:
  selector:
    matchLabels:
      app: ingress-helloworld
  replicas: 1
  template:
    metadata:
      labels:
        app: ingress-helloworld
    spec:
      containers:
        - name: ingress-helloworld
          image: gcr.io/google-samples/hello-app:1.0
          ports:
            - containerPort: 8080
          resources:
            limits:
              cpu: 10m
              memory: 30Mi
            requests:
              cpu: 10m
              memory: 30Mi
---
apiVersion: v1
kind: Service
metadata:
  name: ingress-helloworld
  labels:
    app: ingress-helloworld
spec:
  ports:
    - port: 8080
      protocol: TCP
  selector:
    app: ingress-helloworld
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-helloworld
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-production
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - annotation.your.domain # あなたのドメインに書き換えてください
      secretName: nginx-annotation-tls
  rules:
    - host: annotation.your.domain # あなたのドメインに書き換えてください
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: ingress-helloworld
                port:
                  number: 8080
```

```bash
kubectl apply -f cert-sample.yaml
```

作成には時間がかかる場合があります。うまくいっていれば以下のような出力を得られるはずです。

```bash
curl https://annotation.your.domain
Hello, world!
Version: 1.0.0
Hostname: ingress-helloworld-6f7dc7d764-qd9l6
```

以下のコマンドを実行することで発行された証明書の情報を確認できます。

```bash
kubectl describe certificate
```

今回は証明書の発行に annotation を用いましたが、直接証明書を表す`Certificate`を作成してそれを適用させることもできます。
詳しくは公式ドキュメントをご覧ください。

- [Frequently Asked Questions (FAQ) - cert-manager Documentation](https://cert-manager.io/docs/faq/#certificates)
- [Securing Ingress Resources - cert-manager Documentation](https://cert-manager.io/docs/usage/ingress/#supported-annotations)

最後にリソースを片付けます。自動で作成される Secret は削除されないので手動で消します。

```bash
kubectl delete -f cert-sample.yaml
kubectl delete secrets nginx-annotation-tls
```

## 終わりに

すばらしい OSS のおかげで内部の挙動をほぼわかっていなくてもここまで行うことができました。
ひとまず、お家 kubernetes が 1 ステップ成長したような気がしてうれしいです。

次の目標として以下を考えています。

- node や pod のメトリクスを自動収集してかっこいいダッシュボードで見られるようにする
- devcontainer のように kubernetes 内で開発できるようにする
- 外部からのアクセスをお家 kubernetes で処理できるようにする

まだまだ先は遠いですが 1 つづつこなして、僕の考えた最強の kubernetes に近づけていきたいと思います。

## 余談

普段の作業ログを Obsidian を使って記録しているのですが、画像をコピペした時に作られる場所をカスタムできるのをはじめて知りました。
めちゃくちゃ便利なこの機能をもっと早く知りたかった...
