---
title: "お家kubernetesをkubesprayで構築してみた"
createdAt: "2023-06-26"
emoji: "🕸️"
category: "tech"
tags:
  - kubernetes
---

## 概要

先日から kubernetes を触っていたのですが、DockerDesktop についている kubernetes ではなく
実際に複数のマシンで構成されるクラスターがほしくなったので、土日を使って構築しました。
その流れをここでご紹介したいと思います。

※ kubernetes 自体については、ほかの方が書かれた素晴らしい記事があるので省略します。ご了承ください。

## 材料調達

利用する材料は以下の通りです。今回はすべて Amazon で調達しました。値段等は購入時のものであることをご承知ください。

|             品名             | 個数 |     値段     | 備考                                                                                           |
| :--------------------------: | :--: | :----------: | :--------------------------------------------------------------------------------------------- |
|      NucBox5(N5105/8GB)      |  3   |    15,446    | Raspberry Pi と同程度の値段だったのでこちらを購入。<br/>Windows11 込みなので安いほうな気がする |
| TP-Link TL-SG105 L2 スイッチ |  1   |    1,318     | とりあえず安めのものを購入                                                                     |
|  適当な長さの LAN ケーブル   |  4   |     346      | ルータ--スイッチ--PC 接続用で 4 本購入                                                         |
|       USB メモリ 64GB        |  1   |     889      | Ubuntu を入れるため。安くてびっくりした                                                        |
|             合計             |      | ~~49,929~~ 0 | 使いたい放題なので実質 0 円                                                                    |

注文してから 3 日ですべて届きました。

## 構成

物理は適当にルータ - スイッチ - PC 間 LAN ケーブルでつなげただけなので省略します。

### Ubuntu22.04 をインストール

はじめに OS を Windows から Ubuntu22.04 に置き換えます。Windows のライセンスはもったいないので取っておきましょう。

まず Ubuntu Server22.04 を下記サイトからダウンロードしてきます。バージョンは実行時で違う可能性があるのでよく確認してください。  
https://ubuntu.com/download/server

続いて USB インストールメディアを作成します。今回は Rufas というアプリを利用しました。
使い方自体は見た目でなんとなくわかると思いますし、調べれば簡単に日本語記事を発見することができると思います。  
https://rufus.ie/ja/

PC に作成した USB を挿して、電源ボタンを押したら F2 を連打して BIOS に入ります（UFEI かもしれない。ここら辺よくわかってません）。
詳細な文言は忘れましたが、「Ubuntu Server をインストール」のような文章を選択するとインストール画面に入ります。
ここから先の設定は各自の環境に併せて適当に設定してください。基本的にはデフォルトの設定で問題ないと思います。

インストールが完了したら、USB を抜いておいてください。そうしないとまた BIOS でインストールが進められもう一度インストールする羽目になります。
私はこれに気付かずに 2 回追加でインストールするという貴重な経験をしました。

### ネットワーク

最終的にネットワーク構成はこうなりました。

![ネットワーク概要](src/assets/images/create-home-kubernates-with-kubespray/network.svg)

本当は普段使いのネットワークと kubernetes が入っているネットワークは分けたかったのですが、
L3 スイッチやルータを追加で買うのも面倒だったので同じネットワークに所属しています。

## kubernetes のインストール

調べた限り kubernetes のインストール方法でメジャーなものは以下の 3 つのようです。

1. the hard way
   - https://github.com/kelseyhightower/kubernetes-the-hard-way
   - 一番大変らしい
2. kubeadm
   - https://kubernetes.io/ja/docs/setup/production-environment/tools/kubeadm/
   - the hard way の作業の作業のいくつかを肩代わりしてくれるらしい
3. kops
   - こいつは調べてません
4. kubespray
   - https://kubespray.io/#/
   - kubernetes インストールのための Ansible のセット。IoC 的なものだと思ってます。

今回は楽したいので kubespray を使って組んでいきます。

### kubespray を使ってインストール

はじめに kubespray のリポジトリを手元に持ってきます。

```bash
git clone https://github.com/kubernetes-sigs/kubespray.git
cd kubespray
```

これ以降は下記にあるように Ansible が実行できる環境であることを前提にします。  
https://kubespray.io/#/docs/ansible?id=installing-ansible

手っ取り早く環境を準備したい方は公式が Docker イメージを用意してくれているので、
こちらを利用するのが楽だと思います。
私はこれを利用しました。  
https://quay.io/repository/kubespray/kubespray?tab=tags

はじめに以下のコマンドを実行します。2 行目のに関しては各自が設定した IP アドレスに合わせて修正してください。

```bash
cp -r inventory/sample inventory/mycluster
declare -a IPS=(192.168.1.100 192.168.1.101 192.168.1.102)
CONFIG_FILE=inventory/mycluster/hosts.yml python3 contrib/inventory_builder/inventory.py ${IPS[@]}
```

すると`inventory/mycluster/hosts.yml`が生成されます。公式では秘密鍵で行うことを想定していそうですが、
個人環境ということもあり鍵交換が面倒なのでパスワードをべた書きして実行します。

```yaml
all:
  hosts:
    node1:
      ansible_host: 192.168.1.100
      ip: 192.168.1.100
      access_ip: 192.168.1.100
      ansible_user: xxxx
      ansible_password: xxxx
      ansible_sudo_pass: xxxx
# 略
```

またデフォルトでは CRI として`containerd`が利用されるようですが、今回は`cri-o`を使ってみたいのでいくつか修正します。  
https://kubespray.io/#/docs/cri-o

- `inventory/mycluster/group_vars/all.yml`

```diff
< # download_container: true
---
> download_container: false
> skip_downloads: false
> etcd_deployment_type: host # optionally kubeadm
```

- `inventory/mycluster/group_vars/k8s_cluster/k8s-cluster.yml`

```diff
< container_manager: containerd
---
> container_manager: crio
```

ついでにクラスター構築後、普段使いの PC から簡単にアクセスできるように以下の設定も追加します。以下の設定をすると構築後`artifacts`以下に`admin.conf`がコピーされてきます。  
https://kubespray.io/#/docs/getting-started?id=accessing-kubernetes-api

- `inventory/mycluster/group_vars/k8s_cluster/k8s-cluster.yml`

```diff
< # kubeconfig_localhost: false
---
> kubeconfig_localhost: true
```

最後に以下のコマンドを実行します。15~20 分程度かかるのでコーヒーでも飲んで待ちましょう。

```bash
ansible-playbook -i inventory/mycluster/hosts.yml cluster.yml -b -v
```

秘密鍵で行う方はこちら

```bash
ansible-playbook -i inventory/mycluster/hosts.yml cluster.yml -b -v \
  --private-key=~/.ssh/your_rivate_key
```

しばらくすると実行が完了し`inventory/mycluster/artifacts`に`admin.conf`が生成されているはずです。
最後に正しく動いているか確認のために`kubectl`でノードの状態を取得します。

```bash
kubectl get nodes --kubeconfig inventory/mycluster/artifacts/admin.conf
```

STATUS が Ready になっている下のような形の出力が得られれば成功です！

```bash
NAME      STATUS   ROLES           AGE   VERSION
master1   Ready    control-plane   8h    v1.26.5
node1     Ready    <none>          8h    v1.26.5
node2     Ready    <none>          8h    v1.26.5
```

## お家 kubernetes を使ってみる

さて、作っただけでは面白くないので実際に適当なサービスをデプロイしてみます。
今回は適当な Nginx を Deployment として作成、Service を用いて各 Pod に通信を行います。

- `sample-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: docker.io/nginx:latest
          resources:
            limits:
              memory: "64Mi"
              cpu: "50m"
          ports:
            - containerPort: 80

---
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  selector:
    app: nginx
  ports:
    - port: 80
      targetPort: 80
      protocol: TCP
```

```bash
kubectl apply -f sample-deployment.yaml
```

きちんと作成されているか確認します

```bash
kubectl get all -o wide
```

```bash
NAME                        READY   STATUS    RESTARTS   AGE   IP               NODE      NOMINATED NODE   READINESS GATES
pod/nginx-54969dd6c-54fmm   1/1     Running   0          90s   10.233.104.71    master1   <none>           <none>
pod/nginx-54969dd6c-75b7v   1/1     Running   0          90s   10.233.75.14     node2     <none>           <none>
pod/nginx-54969dd6c-f8srp   1/1     Running   0          90s   10.233.102.142   node1     <none>           <none>

NAME                    TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE    SELECTOR
service/kubernetes      ClusterIP   10.233.0.1      <none>        443/TCP   5d4h   <none>
service/nginx-service   ClusterIP   10.233.31.146   <none>        80/TCP    90s    app=nginx

NAME                    READY   UP-TO-DATE   AVAILABLE   AGE   CONTAINERS   IMAGES                   SELECTOR
deployment.apps/nginx   3/3     3            3           90s   nginx        docker.io/nginx:latest   app=nginx

NAME                              DESIRED   CURRENT   READY   AGE   CONTAINERS   IMAGES                   SELECTOR
replicaset.apps/nginx-54969dd6c   3         3         3       90s   nginx        docker.io/nginx:latest   app=nginx,pod-template-hash=54969dd6c
```

```bash
kubectl get endpoints
```

```bash
NAME            ENDPOINTS                                            AGE
kubernetes      192.168.1.100:6443                                   5d4h
nginx-service   10.233.102.142:80,10.233.104.71:80,10.233.75.14:80   2m35s
```

しっかり作成できているようです。今回 Service を作成しましたが LoadBalancer や Ingress の Controller が
クラスターに設定されていないため、port-forward を使用します。

```bash
kubectl port-forward services/nginx-service 8080:80
```

![](src/assets/images/create-home-kubernates-with-kubespray/access-nginx-service-replica-3.png)

ブラウザで localhost:8080 アクセスしてみると Nginx のメッセージを確認できました。
一応実験として Pod を削除した時にはアクセスできないことも確かめておきます。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
spec:
  replicas: 0 # ここを編集
# 略
```

```bash
kubectl apply -f sample-deployment.yaml
```

![](src/assets/images/create-home-kubernates-with-kubespray/access-nginx-service-replica-0.png)

当然ですがアクセスできません。ログを確認すると「Pod との接続が無くなったぞ!!」と怒っているようです。~~このログが出るのをはじめて見ました~~

```bash
Forwarding from 127.0.0.1:8080 -> 80
Forwarding from [::1]:8080 -> 80
Handling connection for 8080
Handling connection for 8080
Handling connection for 8080
E0701 03:32:01.534129   22292 portforward.go:406] an error occurred forwarding 8080 -> 80: error forwarding port 80 to pod 7ea9c374df74dbcd26038743db6ca2928c213cee4328ccdccabde41875ac5e0d, uid : port forward into network namespace "/var/run/netns/10bbabd3-7c63-4832-a83b-da2ba71d00f7": failed to connect to localhost:80 inside namespace 7ea9c374df74dbcd26038743db6ca2928c213cee4328ccdccabde41875ac5e0d: dial tcp 127.0.0.1:80: connect: connection refused
E0701 03:32:01.534330   22292 portforward.go:234] lost connection to pod
```

最後に作成したリソースを削除します

```bash
kubectl delete -f sample-deployment.yaml
```

## おわりに

kubespray を使うことで簡単にお家 kubernetes を作成することができました。
ですがまだこのクラスターはまったくいい感じではありません。
たとえば、Service にアクセスするのにわざわざポートフォワードを使わないといけません。
そこは Ingress でいい感じに公開してほしいものです。
ログなども手動で取得しなくてはいけません。自動で収集してそのログをかっこいいダッシュボードで見たいです。

と、やりたいことがまだまだあるので僕の考えた最強の kubernetes を目指して、このお家 kubernetes を少しずつ育てていきたいと思います。
