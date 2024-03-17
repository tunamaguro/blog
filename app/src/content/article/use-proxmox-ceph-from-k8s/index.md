---
title: "kubernetesからProxmoxのCephを使う"
createdAt: "2024-03-18"
emoji: "🤖"
category: "tech"
tags:
  - kubernetes
  - Proxmox
---

## この記事を読んでできるようになること

- kubernetes 上から Proxmox 上の Ceph を PV として利用する

## この記事を読んでもできないこと

- kubernetes 上から Proxmox 上の Ceph を S3互換のストレージ として利用する
  - 実際はできると思われるが未検証
  - https://rook.io/docs/rook/latest-release/Storage-Configuration/Object-Storage-RGW/object-storage/#connect-to-an-external-object-store

## お断り

これは個人的な備忘録として作業中のメモを整理したものです。筆者はあまり詳しくないため誤った、もしくは推奨されていない操作を行っている可能性があります。
内容が更新されている可能性があるため、公式ドキュメントを確認することをオススメします

- https://rook.io/docs/rook/latest-release/Getting-Started/intro/
- https://pve.proxmox.com/wiki/Deploy_Hyper-Converged_Ceph_Cluster

以下常体で記載

## モチベーション

Rook を使うことで kubernetes 上に Ceph を利用できるが、Proxmox も各 VM やイメージの保存先として Ceph を構築する機能を提供してくれている。
Proxmoxがわざわざ用意してくれているのに、それを使わないのはもったいない

## Rookをインストール

参考: https://rook.io/docs/rook/latest-release/Helm-Charts/operator-chart/

ひとまずRookのオペレーターをインストールする。Helmを使う場合は下のように実行する

```bash
helm repo add rook-release https://charts.rook.io/release
helm install --create-namespace --namespace rook-ceph rook-ceph rook-release/rook-ceph
```

今回はArgoCDを使った

```bash
argocd app create --file apps/rook.yaml
```

FYI: https://github.com/tunamaguro/home-kubernetes-open/blob/fab295cd6d373642fc377a9feea11b04e654da96/base-extensions/apps/rook.yaml

しばらくするとRookのオペレーターが起動したことを確認できる

```bash
kubectl get pod -n rook-ceph
```

起動していることを確認できればRookのインストールは完了

## Ceph接続情報の取得

参考: https://rook.io/docs/rook/latest-release/CRDs/Cluster/external-cluster/

CephをProxmoxから利用できる状態となっていて、cephfsが有効になっていることを前提にする。
まずRookがPVを作成するpoolを作成する。このpoolという概念もよく分かっていないが、雰囲気からしてこのpoolがブロックデバイス的な何かを切り出す設定なのだと思う

Web UIから`Ceph`->`Pools`を開いて`Create`を押し、Rookから利用するpoolを作成する。設定は好きなもので問題ないと思う
![alt text](src/assets/images/use-proxmox-ceph-from-k8s/proxmox-ceph-sidebar.png)
![alt text](src/assets/images/use-proxmox-ceph-from-k8s/webui-create-ceph-pool.png)

もしくはProxmoxのホスト上でコマンドを実行する

```bash
pveceph pool create k8s-pv-pool --pg_autoscale_mode-on
```

FYI: [コマンドオプション](https://pve.proxmox.com/pve-docs/pveceph.1.html)

作成が完了したら次のコマンドを**Proxmoxのホスト上**で実行する。必要があれば`--dry-run`オプションをつけて実行することで動作チェックができる

```bash
wget https://raw.githubusercontent.com/rook/rook/release-1.13/deploy/examples/create-external-cluster-resources.py
python3 create-external-cluster-resources.py --namespace rook-ceph-external --rbd-data-pool-name k8s-pv-pool --format bash --skip-monitoring-endpoint --v2-port-enable
```

出力されたコマンドは次に使うのでメモしておく

## Cephクラスターのデプロイ

**kubectlが使えるホスト上**で、つまりクラスターへの操作権限があるホスト上で、先ほど得られたコマンドを実行する

```bash
export NAMESPACE=rook-ceph-external
...
export RGW_POOL_PREFIX=default
```

その後次のコマンドも実行する。いろいろ作成されたログが流れると思う

```bash
wget https://raw.githubusercontent.com/rook/rook/release-1.13/deploy/examples/import-external-cluster.sh
. import-external-cluster.sh
```

この時点で`storageClass`が作成されてはいるが現状まだ利用できないので、外部に接続する用のCephクラスターをデプロイする

```bash
wget https://raw.githubusercontent.com/rook/rook/release-1.13/deploy/charts/rook-ceph-cluster/values-external.yaml
helm install --create-namespace --namespace $NAMESPACE rook-ceph-cluster --set operatorNamespace=rook-ceph rook-release/rook-ceph-cluster -f values-external.yaml
```

今回はArgoCDを使った。下に私が使ったマニフェストを貼るが、若干パラメーターが異なるため適時修正が必要だと思う

```bash
argocd app create --file rook/ceph-external-cluster.yaml
argocd app sync argocd/rook-ceph-external-cluster
```

https://github.com/tunamaguro/home-kubernetes-open/blob/fab295cd6d373642fc377a9feea11b04e654da96/base-extensions/rook/ceph-external-cluster.yaml

ここまでの作業がうまくいっていれば、Proxmox上のCephをRookを通じて利用できるようになっている

## 動作チェック

次の2つのマニフェストを作成する

- `test-pvc.yaml`

```yaml
# https://github.com/rook/rook/blob/release-1.13/deploy/examples/csi/rbd/pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: rbd-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
  storageClassName: ceph-rbd
```

- `test-pod.yaml`

```yaml
# Ref: https://github.com/rook/rook/blob/release-1.13/deploy/examples/csi/rbd/pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: csirbd-demo-pod
spec:
  containers:
    - name: web-server
      image: nginx
      volumeMounts:
        - name: mypvc
          mountPath: /var/lib/www/html
  volumes:
    - name: mypvc
      persistentVolumeClaim:
        claimName: rbd-pvc
        readOnly: false
```

上2つのマニフェストをapplyする

```bash
kubectl apply -f test-pvc.yaml -f test-pod.yaml 
```
```bash
kubectl get pod
NAME              READY   STATUS    RESTARTS   AGE
csirbd-demo-pod   1/1     Running   0          14s
```

適当なファイルをpvcがマウントされているディレクトリに作成してみる

```bash
kubectl exec -it csirbd-demo-pod -- echo "Hello World" > /var/lib/www/html/index.html
```

Podを消して再度起動し、先ほど書き込んだ内容が保持されていることを確認する

```bash
kubectl delete -f test-pod.yaml 
kubectl apply -f test-pod.yaml 
kubectl exec -it csirbd-demo-pod -- cat /var/lib/www/html/index.html 
```

作成したリソースを削除する

```bash
kubectl delete -f test-pvc.yaml -f test-pod.yaml 
```

## 終わりに
以上でRookを使ってProxmox上のCephを利用できるようになっているはずだ。kubernetesを組む場合のデータの永続化の手段として使われることが多い（気がする）[local-path-provisioner](https://github.com/rancher/local-path-provisioner)や、[nfs-provisioner](https://github.com/kubernetes-sigs/nfs-subdir-external-provisioner)と比較して耐障害性が必要な場合、~~や分散ストレージの言葉のカッコよさに惹かれて、~~ 利用するのが良いと思う。
