---
title: "kubernetesでGrafanaの表示が正しくない問題を直す"
createdAt: "2023-10-25"
emoji: "🐚"
category: tech
tags:
  - kubernetes
  - Grafana
  - Prometheus
---

## はじめに

お家 Kubernetes を構築後、どれだけメモリや cpu が使われているのか気になり`Prometheus` + `Grafana`な環境を Helm を使って導入しました

https://github.com/prometheus-community/helm-charts

こちらの導入方法は多くの素晴らしい記事が存在するため割愛しますが、利用していると`kubectl top`のメモリ使用率と
`Grafana`で可視化した際のメモリ使用率が異なっていることに気づきました。具体的には下の画像の通りです

```bash
$ kubectl top pod -n ingress-nginx
NAME                                        CPU(cores)   MEMORY(bytes)
ingress-nginx-controller-5fcb5746fc-wcbs8   4m           97Mi
```

![Grafana shows incorrect value](src/assets/images/kube-prometheus-stack-cpu-usage-is-not-correct/grafana-chart-incorrect.png)

大体 2 倍程度大きく表示されています。

## 解決策

忙しい方のために今回の解決策だけ示すと

1. 名前空間`kube-system`内に、`*-kube-prometheus-stack-kubelet`または`*-prometheus-operator-kubelet`という`Service`が複数あるか調べる

```bash
kubectl -n kube-system get service
NAME                                            TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)                        AGE
kube-dns                                        ClusterIP   10.96.0.10   <none>        53/UDP,53/TCP,9153/TCP         109d
kube-prometheus-stack-coredns                   ClusterIP   None         <none>        9153/TCP                       3d17h
kube-prometheus-stack-kube-controller-manager   ClusterIP   None         <none>        10257/TCP                      3d17h
kube-prometheus-stack-kube-etcd                 ClusterIP   None         <none>        2381/TCP                       3d17h
kube-prometheus-stack-kube-proxy                ClusterIP   None         <none>        10249/TCP                      3d17h
kube-prometheus-stack-kube-scheduler            ClusterIP   None         <none>        10259/TCP                      3d17h
kube-prometheus-stack-kubelet                   ClusterIP   None         <none>        10250/TCP,10255/TCP,4194/TCP   80d 👈これ
monitoring-kube-prometheus-kubelet              ClusterIP   None         <none>        10250/TCP,10255/TCP,4194/TCP   80d 👈これ
```

2. 複数ある場合不要な方を消す。私の場合、`kube-prometheus-stack`を導入していたので`monitoring-kube-prometheus-kubelet`を削除する

```bash
kubectl -n kube-system delete service monitoring-kube-prometheus-kubelet
```

3. 5 分ほど待つと`Grafana`に正しい値が記録され始めます

```bash
$ kubectl top pod -n ingress-nginx
NAME                                        CPU(cores)   MEMORY(bytes)
ingress-nginx-controller-5fcb5746fc-wcbs8   2m           96Mi
```

![Grafana shows correct value](src/assets/images/kube-prometheus-stack-cpu-usage-is-not-correct/grafana-chart-correct.png)

## 原因

基本的にすべて下の Issue に書いてありました

https://github.com/prometheus-community/helm-charts/issues/192

過去に`prometheus-operator`を導入していた場合、Helm が`kube-system`のサービスを削除しなかったために複数の値(今回は 2 つ)が記録され、
実際より多い値が Grafana で表示されていたようです。

実際に Grafana でクエリを発行して表の`Service`を確認すると、写真が小さく見にくいですが 2 つのサービスから値が記録されていたことがわかります。

![Send from two Service](src/assets/images/kube-prometheus-stack-cpu-usage-is-not-correct/value-from-two-service.png)

つまるところ、「過去のゴミが削除されずに悪さをしていた」というおちでした。

## 後書き

いくら`Helm`が自動でいろいろインストールからアンインストールまで面倒を見てくれる便利なツールだといっても、
何がインストールされるか、あるいはしっかりアンインストールされたかの確認が重要だということを学べました。

なかなかピンポイントな記事ですが、ここまでお読みいただきありがとうございました
