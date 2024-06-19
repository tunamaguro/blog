---
title: "kube-vipをDaemonSetで使う"
createdAt: "2024-06-17"
emoji: "🗄️"
category: "tech"
tags:
  - kubernetes
---

## はじめに

kube-vipを使ったHAクラスターの構築例は多くありますが、多くがStatic Podを利用したものです。DaemonSetを使った構築を挑戦したのでその記録を共有します

## 環境

- 仮想化環境: Proxmox8.2
- ベースイメージ: Ubuntu24.04 - cloud-init
  - https://cloud-images.ubuntu.com/noble/current/noble-server-cloudimg-amd64.img

## kube-vipについて

公式サイト: https://kube-vip.io/

kube-vipはコントロールプレーンに対するVIPや、ロードバランサー(Serviceのやつ)を作成できるものです。ここではコントロールプレーンに対するVIPを利用し、HAクラスタ構築を行います

構築方法として、`Static Pod`と`DaemonSet`の2種類がありますが各コントロールプレーンに`Static Pod`を毎回書くのは大変なため、`DaemonSet`を使って構築します

## 構築手順

### 前提

VIPを`192.168.20.100`に作ることにします。またIPアドレスなどは各自の環境に合わせて読み替えてください

### VMの作成

Ubuntu24.04をベースイメージにしてVMを作成します。私の環境ではcloud-initのものを使いましたが、通常の版のものでも問題ないと思います。スペックは以下のようにしておきます

| name       | value |
| ---------- | ----- |
| Memory     | 4.0GB |
| Processors | 2     |
| Hard Disk  | 8GB   |

![Proxmoxのスペック](src/assets/images/kube-vip-ha-20240617/base-image-spec.png)

### コンテナランタイムのインストール

コンテナランタイムには`containerd`や`cri-o`などがありますが、今回は`containerd`を使います。ここでは以下のインストール手順を参考に進めます

https://github.com/containerd/containerd/blob/main/docs/getting-started.md#option-2-from-apt-get-or-dnf

> `cri-o`でも試してみましたが、なぜか`kube-vip`がうまく動きませんでした

IPv4フォワーディングを有効にします

```bash
# sysctl params required by setup, params persist across reboots
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.ipv4.ip_forward = 1
EOF

# Apply sysctl params without reboot
sudo sysctl --system
```

以下のコマンドを使ってDockerリポジトリを追加し、`containerd`をインストールします

```bash
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update

sudo apt-get install containerd.io
```

CNIは別で入れるためここでは`containerd.io`を入れます。インストール完了後動作していることを確認してください

```bash
sudo systemctl status containerd.service
● containerd.service - containerd container runtime
     Loaded: loaded (/usr/lib/systemd/system/containerd.service; enabled; prese>
     Active: active (running) since Mon 2024-06-17 12:05:52 UTC; 2min 29s ago
       Docs: https://containerd.io
    Process: 1888 ExecStartPre=/sbin/modprobe overlay (code=exited, status=0/SU>
   Main PID: 1890 (containerd)
      Tasks: 8
     Memory: 12.0M (peak: 12.4M)
        CPU: 137ms
     CGroup: /system.slice/containerd.service
             └─1890 /usr/bin/containerd
```

追加で`containerd`のオプションを一部変更しておきます

```bash
containerd config default | sudo tee /etc/containerd/config.toml
sudo vim /etc/containerd/config.toml
```

```diff
- sandbox_image = "registry.k8s.io/pause:3.6"
+ sandbox_image = "registry.k8s.io/pause:3.9"
[plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
- SystemdCgroup = false
+ SystemdCgroup = true
```

`containerd`を再起動します

```bash
sudo systemctl restart containerd
```

### kubeadmのインストール

参考

- https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/

スワップを無効化します

```bash
sudo swapoff -a
sudo vim /etc/fstab
```

次に`kubeadm`やその他のツールをインストールします。`kubelet`のバージョンが変わると困るので固定しておきます

```bash
sudo apt-get install -y apt-transport-https ca-certificates curl gpg
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.30/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.30/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list
sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl
```

### kube-vipの準備

参考

- https://kube-vip.io/docs/installation/daemonset/

kube-vip用のマニフェストを生成します。`VIP`の値を各自が設定したいVIPのアドレス、`INTERFACE`はVIPが待ち受けを行うネットワークインターフェイスを指定してください。
お使いの環境でのネットワークインターフェイスは`networkctl list`で確認できます

```bash
export VIP=192.168.20.100
export INTERFACE=eth0
KVVERSION=$(curl -sL https://api.github.com/repos/kube-vip/kube-vip/releases | jq -r ".[0].name")
alias kube-vip="sudo ctr image pull ghcr.io/kube-vip/kube-vip:$KVVERSION; sudo ctr run --rm --net-host ghcr.io/kube-vip/kube-vip:$KVVERSION vip /kube-vip"
kube-vip manifest daemonset \
    --interface $INTERFACE \
    --address $VIP \
    --inCluster \
    --taint \
    --controlplane \
    --services \
    --arp \
    --leaderElection | tee vip-daemonset.yaml
```

次に`/etc/hosts`に設定を書き加えます（`cloud-init`の影響で変更しているファイルが若干違います）。ここはお使いのDNSで設定してもよいと思います

```bash
tail /etc/cloud/templates/hosts.debian.tmpl --line 2
192.168.20.100 k8s-api-server-endpoint

```

<!-- ### その他

将来的に`prometheus`などを導入したいので`kubeadm`をデフォルトの設定から一部変更します

```bash
kubeadm config print init-defaults > kubeadm_init_config.yaml
```

今回は次のように変更しました

```yaml title="kubeadm_init_config.yaml"
apiVersion: kubeadm.k8s.io/v1beta3
bootstrapTokens:
  - groups:
      - system:bootstrappers:kubeadm:default-node-token
    token: abcdef.0123456789abcdef
    ttl: 24h0m0s
    usages:
      - signing
      - authentication
kind: InitConfiguration
localAPIEndpoint:
  advertiseAddress: 0.0.0.0
  bindPort: 6443
nodeRegistration:
  criSocket: unix:///var/run/containerd/containerd.sock
  imagePullPolicy: IfNotPresent
  name: node
  taints: null
---
apiServer:
  timeoutForControlPlane: 4m0s
  extraArgs:
    authorization-mode: "Node,RBAC"
  certSANs:
    - "192.168.20.100"
apiVersion: kubeadm.k8s.io/v1beta3
certificatesDir: /etc/kubernetes/pki
clusterName: kubernetes
controllerManager:
  extraArgs:
    bind-address: "0.0.0.0"
dns: {}
etcd:
  local:
    dataDir: /var/lib/etcd
imageRepository: registry.k8s.io
kind: ClusterConfiguration
kubernetesVersion: 1.30.0
controlPlaneEndpoint: "k8s-api-server-endpoint:6443"
networking:
  dnsDomain: cluster.local
  serviceSubnet: 10.96.0.0/12
  podSubnet: 10.1.0.0/16
scheduler:
  extraArgs:
    bind-address: "0.0.0.0"
``` -->

### クラスタの初期化

先ほど作成したVMを停止し、適当な数クローンします。この際3以上の奇数である必要があることに注意してください。今回は3個クローンしました。
また、この際IPアドレスを固定しておいてください。今回は次のようにしました

- kube-vip1: 192.168.20.80
- kube-vip2: 192.168.20.81
- kube-vip3: 192.168.20.82

kube-vip1に接続し`/etc/hosts`を書き換えます

```bash
sudo vim /etc/hosts
tail /etc/hosts --lines=2
127.0.0.1 k8s-api-server-endpoint

sudo systemctl restart systemd-resolved.service
```

次のコマンドでクラスタを初期化します。この際出ていたjoin用のコマンドはメモしておいてください

```bash
sudo kubeadm init --control-plane-endpoint "k8s-api-server-endpoint:6443" --pod-network-cidr=10.1.0.0/16 --upload-certs --apiserver-cert-extra-sans "192.168.20.100" --skip-phases=addon/kube-proxy
```

<!-- ```bash
sudo kubeadm init --config kubeadm_init_config.yaml --upload-certs
``` -->

一応動作確認をしておきます

```bash
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
kubectl get pod -A
```

### kube-vipのデプロイ

参考

- https://kube-vip.io/docs/installation/daemonset/

まずデプロイするためのRBACを作成します

```bash
kubectl apply -f https://kube-vip.io/manifests/rbac.yaml
```

先ほど作成したkube-vipのマニフェストをデプロイします

```bash
kubectl apply -f vip-daemonset.yaml
```

簡単に動作確認をします。kube-vip関連のPodが動いでいることを確認してください

```bash
 kubectl get pod -A
NAMESPACE     NAME                                READY   STATUS    RESTARTS   AGE
kube-system   coredns-7db6d8ff4d-728kx            0/1     Pending   0          7m54s
kube-system   coredns-7db6d8ff4d-7lt66            0/1     Pending   0          7m54s
kube-system   etcd-kube-vip1                      1/1     Running   0          8m8s
kube-system   kube-apiserver-kube-vip1            1/1     Running   0          8m8s
kube-system   kube-controller-manager-kube-vip1   1/1     Running   0          8m8s
kube-system   kube-scheduler-kube-vip1            1/1     Running   0          8m8s
kube-system   kube-vip-ds-rsbn9                   1/1     Running   0          63s #これです
```

### Ciliumのデプロイ

参考

- https://helm.sh/docs/intro/install/
- https://docs.cilium.io/en/stable/network/kubernetes/kubeproxy-free/

CNIのCiliumをデプロイするために、Helmをインストールします

```bash
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
chmod 700 get_helm.sh
./get_helm.sh
```

Ciliumをデプロイします。この時まだ`kube-vip`は動作していないため現在のノードのIPアドレスにすることを注意してください

```bash
helm repo add cilium https://helm.cilium.io/
API_SERVER_IP=192.168.20.80
# Kubeadm default is 6443
API_SERVER_PORT=6443
helm install cilium cilium/cilium --version 1.15.6 \
    --namespace kube-system \
    --set kubeProxyReplacement=true \
    --set k8sServiceHost=${API_SERVER_IP} \
    --set k8sServicePort=${API_SERVER_PORT}
```

デプロイ後、STATUSがReadyになっていることを確認します

```bash
 kubectl get node
NAME        STATUS   ROLES           AGE   VERSION
kube-vip1   Ready    control-plane   13m   v1.30.2
```

### kube-vipのデプロイ

参考

- https://kube-vip.io/docs/installation/daemonset/

次にkube-vipのデプロイを行います。まずkube-vip用のRBACを作成します

```bash
kubectl apply -f https://kube-vip.io/manifests/rbac.yaml
```

次に作成したkube-vipのマニフェストをapplyします

```bash
kubectl apply -f vip-daemonset.yaml
```

kube-vipのPodが動作していることを確認してください

```bash
kubectl get -f vip-daemonset.yaml
NAME          DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR   AGE
kube-vip-ds   1         1         1       1            1           <none>          23s
```

`.kube/config`を編集してVIPを宛先に変更しても、`kubectl`が使えることを確認します

```diff title=".kube/config"
- server: https://k8s-api-server-endpoint:6443
+ server: https://192.168.20.100:6443
```

```bash
 kubectl get node
NAME        STATUS   ROLES           AGE   VERSION
kube-vip1   Ready    control-plane   20m   v1.30.2
```

### 他のコントロールプレーン追加

他のノードに入り、出力されていたjoinコマンドを実行します

```bash
sudo kubeadm join k8s-api-server-endpoint:6443 --token <token> \
        --discovery-token-ca-cert-hash <token-hash> \
        --control-plane --certificate-key <key>
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

もしここまでに時間がかかってしまい、トークンの有効期限が切れてしまった場合、次のコマンドでトークンを再生成できます

```bash
echo $(kubeadm token create --print-join-command) --control-plane --certificate-key $(sudo kubeadm init phase upload-certs --upload-certs | grep -vw -e certificate -e Namespace)
```

この作業を`kube-vip2`,`kube-vip3`で実行します

## 最終的な状態

ここまでの手順をすべて完了すると次のような出力が得られるはずです

```bash
kubectl get node
NAME        STATUS   ROLES           AGE     VERSION
kube-vip1   Ready    control-plane   25m     v1.30.2
kube-vip2   Ready    control-plane   2m43s   v1.30.2
kube-vip3   Ready    control-plane   43s     v1.30.2
```

コントロールプレーンが3台存在し、動作していることがわかります。ここで試しに3VMの内1つ、`kube-vip1`をシャットダウンさせても動作することができるか確認してみます

![3台のVMが起動している](src/assets/images/kube-vip-ha-20240617/final-ha-vms.png)

`kube-vip1`をProxmoxのUIからシャットダウンします

![VMをシャットダウン](src/assets/images/kube-vip-ha-20240617/shutdown-kube-vip1.png)

![kube-vip1がシャットダウンしている](src/assets/images/kube-vip-ha-20240617/shutdown-vm1.png)

`kube-vip2`もしくは`kube-vip3`に入り、`kubectl`が現在も使用できることを確認します

```bash
kubectl get node
NAME        STATUS     ROLES           AGE     VERSION
kube-vip1   NotReady   control-plane   33m     v1.30.2
kube-vip2   Ready      control-plane   10m     v1.30.2
kube-vip3   Ready      control-plane   8m26s   v1.30.2
```

必要があればワーカーノードも追加してみてください

## 終わりに

Static Podを使わずにDaemonSetを使ったHAクラスタ構築ができました。個人的にkube-vipで気に入っているのはHAにするのにほかのアプリケーション(keepalivedやhaproxy)が不要な点です。
すべてがkubernetes上で完結しているのでとてもシンプルだと思います。
