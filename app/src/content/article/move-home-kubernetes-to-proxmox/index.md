---
title: "お家KubernetesをProxmoxで作り直した"
createdAt: "2023-07-08"
emoji: "☀️"
category: "tech"
tags:
  - kubernetes
  - Proxmox
---

## 経緯

[以前の記事で](articles/create-home-kubernates-with-kubespray)でお家kubernetesを構築し色々遊んでいました。
楽しくなってきたので新しいPCを購入しクラスターに追加しようと、何も考えずkubesprayを動かすとetcd周りでエラーが起きてしまったらしく
追加することができませんでした。
そこで、これもいい機会ということで前から気になっていたProxmoxという仮想化環境でkubernetesを作り直しました。
この記事はその作業ログをまとめたものです。

## 環境

- 仮想化環境: Proxmox VE 8.0.3
- 使用したイメージ: Ubuntu Server 22.04
- CRI: CRI-O
- CNI: Calico
- control plane: 1台
- node: 3台

## VM作成

まず、kubernetesのベースとなるVMを作成します。上で紹介したようにUbuntu Server 22.04を利用します。
Proxmoxのインストールについては、多くの解説記事が存在するのでそちらをご覧ください。
今回は以下の設定で作成し、インストール時のオプションはSSHのみ有効にし、それ以外はデフォルトで設定しました。
この部分については各自の環境に合わせて調整してください。

![VM設定](/images/move-home-kubernetes-to-proxmox/proxmox-vm-preference.png)

作成が完了したら、パッケージを更新しておきます

```bash
sudo apt update 
sudo apt upgrade -y
```

## IPv4フォワーディング有効化

[コンテナランタイム | Kubernetes](https://kubernetes.io/ja/docs/setup/production-environment/container-runtimes/)

以下のコマンドを実行します。

```bash
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF

sudo modprobe overlay
sudo modprobe br_netfilter

# この構成に必要なカーネルパラメーター、再起動しても値は永続します
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF

# 再起動せずにカーネルパラメーターを適用
sudo sysctl --system
```

正直何をしているか全然わかっていないので、周りの詳しい方に聞いたほうが良いと思います。一応ChatGPTに聞いてみたら下のように返してきました

![ChatGPTに聞いた](/images/move-home-kubernetes-to-proxmox/ipv4-forwarding-chatgpt.png)

このコマンドを実行して必要なモジュールが正しくロードされていることを確認します

```bash
lsmod | grep br_netfilter
lsmod | grep overlay
```

## swapの無効化

[kubeadmのインストール | Kubernetes](https://kubernetes.io/ja/docs/setup/production-environment/tools/kubeadm/install-kubeadm/)

前提条件として必要なのでswapを無効化します。以下のコマンドを実行してください

```bash
sudo vim /etc/fstab # /swap.imgをコメントアウトする
sudo swapoff -a
```

確認のために下のコマンドを実行してください。うまくいっていれば、2段目Swapの項目がすべて0になっているはずです

```bash
free -h
```

## kubeadm,kubelet,kubectlインストール

[kubeadmのインストール | Kubernetes](https://kubernetes.io/ja/docs/setup/production-environment/tools/kubeadm/install-kubeadm/#kubeadm-kubelet-kubectl%E3%81%AE%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AB)

まず、kubeadmなどのインストールに必要なライブラリをインストールします

```bash
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl
```

Google Cloudの公開鍵ダウンロード

```bash
curl -fsSL https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-archive-keyring.gpg
```

kubernetesのリポジトリをリポジトリリスト追加しダウンロードできるようにします

```bash
echo "deb [signed-by=/etc/apt/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee /etc/apt/sources.list.d/kubernetes.list
```

主要なコンポーネントであるkubelet、kubeadm、kubectlをインストールし、これらのパッケージが自動的にアップデートされないようにバージョンを固定します

```bash
sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl
```

> kubectlをすべて外部のホストから利用する方はkubectlを取り除いておいてください

## CRI-Oインストール

[cri-o/install.md at main · cri-o/cri-o (github.com)](https://github.com/cri-o/cri-o/blob/main/install.md#debian-bullseye-or-higher---ubuntu-2004-or-higher)

上記の公式ドキュメントにしたがって進めていきます。ここから管理者権限が必要な部分が多いので管理者に昇格します

```bash
sudo su
```

次に、以下のコマンドを実行してCRI-Oをインストールします。ただし、exportで設定している値は各自の環境に合わせて変更してください。

```bash
# このバージョンは以下を参照して任意のものに変えてください
# https://cri-o.github.io/cri-o/
export VERSION=1.27
# https://github.com/cri-o/cri-o/blob/main/install.md#apt-based-operating-systems
export OS=xUbuntu_22.04

echo "deb [signed-by=/usr/share/keyrings/libcontainers-archive-keyring.gpg] https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/$OS/ /" > /etc/apt/sources.list.d/devel:kubic:libcontainers:stable.list
echo "deb [signed-by=/usr/share/keyrings/libcontainers-crio-archive-keyring.gpg] https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable:/cri-o:/$VERSION/$OS/ /" > /etc/apt/sources.list.d/devel:kubic:libcontainers:stable:cri-o:$VERSION.list

mkdir -p /usr/share/keyrings
curl -L https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/$OS/Release.key | gpg --dearmor -o /usr/share/keyrings/libcontainers-archive-keyring.gpg
curl -L https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable:/cri-o:/$VERSION/$OS/Release.key | gpg --dearmor -o /usr/share/keyrings/libcontainers-crio-archive-keyring.gpg

apt-get update
apt-get install cri-o cri-o-runc
```

[cri-o/docs/crio.conf.5.md at main · cri-o/cri-o · GitHub](https://github.com/cri-o/cri-o/blob/main/docs/crio.conf.5.md#crioruntimeruntimes-table)  
[image/docs/containers-registries.conf.5.md at main · containers/image · GitHub](https://github.com/containers/image/blob/main/docs/containers-registries.conf.5.md)

CRI-Oはデフォルトの設定ではレジストリ名を与えられなかった際、`docker.io`と`quay.io`を確認します。
プライベートレジストリなどを運用している方はここで設定を変更すると良いと思います。
詳細は上記ドキュメントを参照してください。

次に、CRI-Oがデフォルトで持っているCNIを削除します。このステップが本当に必要かどうかはまだ調査中ですが、試行錯誤の過程で、このステップをスキップすると外部DNSへの接続が失敗する事例が発生しました。詳細が分かり次第、追記します。

```bash
rm -rf /etc/cni/net.d/*
```

最後にCRI-Oを起動します

```bash
sudo systemctl daemon-reload
sudo systemctl enable crio
sudo systemctl start crio
```

正常に起動しているか確認します。`RuntimeReady`の項目がtrueであれば問題ないと思われます

```bash
crictl info
```

![crictl info](/images/move-home-kubernetes-to-proxmox/crictl-info.png)

ここまででVM共通の設定が完了したのでVMをシャットダウンしてください

## クラスター作成

先ほど作成したVMをクローンします。私は計4個クローンしましたが、各自のマシンスペックに合わせて個数を調整してください。
クローン完了後kubeadmが動作するために必要な条件を満たすため、各ノードに入り固定IPの設定とhostnameをすべて異なるものになるように変更します。
詳細は以下ドキュメントを確認してください。

[kubeadmのインストール | Kubernetes](https://kubernetes.io/ja/docs/setup/production-environment/tools/kubeadm/install-kubeadm/)

固定IPの変更は`/etc/netplan`以下のyamlを書き換えることで行えます。

```bash
sudo vim /etc/netplan/00-installer-config.yaml

# This is the network config written by 'subiquity'
network:
  ethernets:
    ens18:
      dhcp4: false
      addresses:
        - 192.168.1.150/24 # ここを各自に合わせて変更
      routes:
        - to: default
          via: 192.168.1.1 # 環境にあった値にしてください
      nameservers:
        addresses:
          - 192.168.1.1  # 環境にあった値にしてください
  version: 2
```

hostnameは以下コマンドで変更できます。

```bash
sudo hostnamectl hostname new-hostname
```

ここまで完了したら設定を読み込むため再起動しておきます

```bash
reboot
```

[kubeadmを使用したクラスターの作成 | Kubernetes](https://kubernetes.io/ja/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/)

コントロールプレーンの初期化をします。ここで指定する`--apiserver-advertise-address`にはコントロールプレーンのアドレスまたはドメイン名です。
`--pod-network-cidr`はクラスター内のPodに割り振られるネットワーク帯です。もし`10.10.0.0/16`がすでに利用されている場合は別のものに変えてください。

```bash
sudo kubeadm init --apiserver-advertise-address=192.168.1.150 --pod-network-cidr=10.10.0.0/16
```

この時表示される`kubeadm join`コマンドはメモしておきます

```bash
kubeadm join 192.168.1.150:6443 --token xxxx \
        --discovery-token-ca-cert-hash sha256:xxxx
```

表示されているコマンド通りkubectlを動作させるためのファイルを持ってきます

```bash
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

完了後、先ほどメモした`kubeadm join`コマンドを各nodeで実行します。
実行したら、コントロールプレーンで以下のコマンドを実行し正しく追加できているか確認します。

```bash
kubectl get node
```

## Calicoインストール

[Install Calico networking and network policy for on-premises deployments | Calico Documentation (tigera.io)](https://docs.tigera.io/calico/latest/getting-started/kubernetes/self-managed-onprem/onpremises)

Pod間の通信を管理するCNIとして`Calico`をインストールします。基本的に上記の公式ドキュメントにしたがって進めます。
まずCalicoのオペレーターを追加します

```bash
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.26.1/manifests/tigera-operator.yaml
```

次に設定ファイルをダウンロードします

```bash
curl https://raw.githubusercontent.com/projectcalico/calico/v3.26.1/manifests/custom-resources.yaml -O
```

上記ファイルのipPoolsの`cidr`を`kubeadm init`時の`--pod-network-cidr`に書き換え、その後設定ファイルを適用します

```yaml
spec:
  # Configures Calico networking.
  calicoNetwork:
    # Note: The ipPools section cannot be modified post-install.
    ipPools:
    - blockSize: 26
      cidr: 10.10.0.0/16 # ここを書き換える
```

```bash
kubectl create -f custom-resources.yaml
```

コンテナーが作成されるまで待ちます。

```bash
watch kubectl get -A all
```

1台のみでクラスターを構成する場合は、コントロールプレーンにPodが割り当てられるようにします。
これは、コントロールプレーンのノードに対するスケジューリング制約を削除することで実現します。ただし、複数のノードがある場合はこの操作は不要です。

[TaintとToleration | Kubernetes](https://kubernetes.io/ja/docs/concepts/scheduling-eviction/taint-and-toleration/)

```bash
kubectl taint nodes --all node-role.kubernetes.io/control-plane-
kubectl taint nodes --all node-role.kubernetes.io/master-
```

## 動作チェック

> ここについては実施しなくても問題ないと思います

毎回ProxmoxのVMに接続するのは面倒なのでconfigファイルを開発用PCに持ってきます。

```bash
scp username@192.168.x.x:/home/username/.kube/config ./tmp.config
```

持ってきたconfigと現在のconfigをマージします。ここは以下のstackoverflowを参考にしました。
出力された内容を確認し、問題がなさそうであればこれを`~/.kube/config`に配置します

[kubernetes - How to merge kubectl config file with ~/.kube/config? - Stack Overflow](https://stackoverflow.com/questions/46184125/how-to-merge-kubectl-config-file-with-kube-config)

```bash
export KUBECONFIG=~/tmp.config:~/.kube/config
kubectl config view --flatten

# 良さそうなら
kubectl config view --flatten  > ~/.kube/config
```

コンテキストを確認して、先ほど作成したクラスターのものに変えます。
（デフォルトだとkubernetes-admin@kubernetes的な名前でしたがあまりにも無骨なので変えました）

```bash
kubectl config get-contexts 
CURRENT   NAME              CLUSTER           AUTHINFO                NAMESPACE
*         docker-desktop    docker-desktop    docker-desktop          
          home-kubernetes   home-kubernetes   home-kubernetes-admin   
```

```bash
kubectl config use-context home-kubernetes 
```

nodeが取得できるか確認します

```bash
kubectl get nodes 
```

簡単な設定ファイルを作成して`apply`します

- `sample-deploy.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  selector:
    matchLabels:
      app: nginx
  replicas: 1
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:latest
        ports:
        - containerPort: 80

---
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
  labels:
    app: nginx
spec:
  ports:
  - port: 80
    protocol: TCP
  selector:
    app: nginx

```

```bash
kubectl apply -f sample-deploy.yaml 
```

ポート転送してアクセスできるか確かめます。これにより、`localhost`の8080ポートがnginxサービスの80ポートにアクセスできるようになります

```bash
kubectl port-forward services/nginx-service 8991:80
```

実際に`http://localhost:8080`にアクセスしてnginxのWelcomeページが表示されれば問題ないと思います
最後にこれを立ち下げます

```bash
kubectl delete -f sample-deploy.yaml 
```

## 終わりに

以上で、Proxmox上にKubernetesクラスターを構築する手順をご紹介しました。
Calicoのインストールの際に少し触れましたが、試行錯誤段階では外部ドメイン名が解決されないという問題が起きていました。
これについて、私の理解が浅いことが原因の1つだと思います。

明日以降、同様の現象がどうしたら起きるのか調査し、自分の理解を深めたいと思います。

ここまでお読みいただき、ありがとうございました。

