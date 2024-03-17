---
title: "お家kubernetesにMisskeyを立てる"
createdAt: "2023-11-07"
emoji: "🇲"
category: "tech"
tags:
  - kubernetes
  - misskey
---

## はじめに

せっかく[お家 kubernetes を作ったので](/articles/move-home-kubernetes-to-proxmox)実際に何かを動かしたいですよね。
そこで、n 番煎じな記事ですがおひとり様 Misskey を立てたので実際に行った内容について自分用のメモとして記録を残します。

## 成果物

タイミングによってはサーバが落ちてアクセスできないかもしれません

https://misskey.tunamaguro.dev/

## 環境

- 仮想化環境: Proxmox VE 8.0.2
- control plane: 1 台
- node: 3 台

```bash
kubectl get node
NAME       STATUS   ROLES           AGE     VERSION
master01   Ready    control-plane   3d16h   v1.28.3
node01     Ready    <none>          3d15h   v1.28.3
node02     Ready    <none>          3d15h   v1.28.3
node03     Ready    <none>          3d15h   v1.28.3
```

詳細については[前回の記事](/articles/move-home-kubernetes-to-proxmox)を参照してください

## 全体構成

![構成図](src/assets/images/personal-misskey-server-on-home-kubernetes/system-configuration.drawio.png)

全体構成は上のようになっています。かなりあるあるな構成だと思いますが、サービスを外部に公開するのに`Cloudflare Tunnel`、
DB の構築に`CloudNativePG`を利用しています。それ以外はすべて Deployment として作成しました。
`Redis`は気分で完全互換を謳っている`KeyDB`に差し替えていますが、今のところ問題なく動作しています。
そのうち高速だという`Dragonfly`でも動作するか試してみる予定です。

## 詰まった点

お家 kubernetes では StorageClass として[nfs-subdir-external-provisioner](https://github.com/kubernetes-sigs/nfs-subdir-external-provisioner)を利用しているのですが、
これを利用して Redis を立ち上ることができず詰まっていました。設定として下のようなファイルを使っていましたが、エラーが発生していました。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: redis-sample
spec:
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
        - name: redis
          image: redis:7.2.2-alpine3.18
          resources:
            requests:
              memory: 100Mi
              cpu: 50m
            limits:
              memory: 500Mi
              cpu: 200m
          ports:
            - name: redis
              containerPort: 6379
              protocol: TCP
          volumeMounts:
            - name: redis-data
              mountPath: /data
      volumes:
        - name: redis-data
          persistentVolumeClaim:
            claimName: redis-data
```

```bash
kubectl -n redis-sample  get pod
NAME                     READY   STATUS             RESTARTS      AGE
redis-6f5f889fc9-nljmm   0/1     CrashLoopBackOff   3 (38s ago)   95s
```

```bash
kubectl -n redis-sample logs deployments/redis
chown: .: Operation not permitted
```

軽く調べた限り、使用しているイメージの起動時にデータを保管している`/data`の所有者を変更しようとして
上記のエラーになっているようでした。そこで、起動時のコマンドを直接指定して起動するようにしたところ発生しなくなりました。

```diff
    spec:
      securityContext:
        runAsUser: 0
      containers:
        - name: redis
          image: redis:7.2.2-alpine3.18
>         command: ["/bin/sh"]
>         args: ["-c", "redis-server"]
```

## その他の設定ファイル

とくに書くことがなくなったので設定ファイルをつらつらと書いていきます。マウントしているコンフィグや PVC、Secret は各自で読み替えてください。

- Misskey 本体

インスタンスを複数に増やした時のために Affinity を一応設定しています。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: misskey-web
  namespace: misskey
spec:
  replicas: 1
  revisionHistoryLimit: 5
  selector:
    matchLabels:
      app: misskey-web
  template:
    metadata:
      labels:
        app: misskey-web

    spec:
      containers:
        - name: misskey-web
          image: misskey/misskey:2023.10.2
          ports:
            - name: web
              containerPort: 3000
              protocol: TCP
          volumeMounts:
            - name: misskey-config
              mountPath: /misskey/.config
          resources:
            requests:
              cpu: 250m
              memory: 512Mi
            limits:
              cpu: 1000m
              memory: 2048Mi
          readinessProbe:
            httpGet:
              path: /
              port: 3000

      volumes:
        - name: misskey-config
          configMap:
            name: misskey-config
            items:
              - key: default.yml
                path: default.yml
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 20
              podAffinityTerm:
                labelSelector:
                  matchExpressions:
                    - key: app
                      operator: In
                      values:
                        - misskey-web
                topologyKey: "kubernetes.io/hostname"
```

- CloudNativePG

バックアップには`Cloudflare R2`を使っています。この個所は設定しなくても動作すると思います。

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: misskey-postgres
  namespace: misskey
spec:
  description: "datbase for Misskey"
  imageName: ghcr.io/cloudnative-pg/postgresql:16.0
  instances: 3
  startDelay: 300
  stopDelay: 300
  primaryUpdateStrategy: unsupervised

  bootstrap:
    initdb:
      database: misskey
      owner: misskey
      secret:
        name: db-misskey-user

  superuserSecret:
    name: db-superuser

  backup:
    barmanObjectStore:
      destinationPath: s3://bucket-name/backups
      endpointURL: https://s3-storage.address
      s3Credentials:
        accessKeyId:
          name: s3-creds
          key: ACCESS_KEY_ID
        secretAccessKey:
          name: s3-creds
          key: ACCESS_SECRET_KEY
      wal:
        compression: bzip2
      data:
        compression: bzip2
    retentionPolicy: "30d"

  storage:
    storageClass: nfs-storage
    size: 10Gi

  resources:
    requests:
      memory: "100Mi"
      cpu: "100m"
    limits:
      memory: "500Mi"
      cpu: "500m"

  monitoring:
    enablePodMonitor: true
```

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: ScheduledBackup
metadata:
  name: misskey-scheduled-backup
  namespace: misskey
spec:
  schedule: "0 0 0 * * *"
  backupOwnerReference: self
  immediate: true
  cluster:
    name: misskey-postgres
```

- Redis

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: misskey
spec:
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
        - name: redis
          image: eqalpha/keydb:x86_64_v6.3.3
          command: ["/bin/sh"]
          args: ["-c", "keydb-server"]
          resources:
            requests:
              memory: 50Mi
              cpu: 50m
            limits:
              memory: 500Mi
              cpu: 200m
          ports:
            - name: redis
              containerPort: 6379
              protocol: TCP
```

残りは適当な設定ファイルや Service なので省きます。

## おわりに

偏見としてこういったサーバ系には比較的スペックの高い PC が必要なイメージでしたが、思ったよりリソースを使っていなくて驚いています。
すべてのポッドを合わせても 2GB 程度です。

```bash
kubectl -n misskey top pod
NAME                           CPU(cores)   MEMORY(bytes)
misskey-postgres-1             43m          333Mi
misskey-postgres-2             12m          325Mi
misskey-postgres-3             42m          315Mi
misskey-web-5568bcbb44-dkbl7   100m         1042Mi
redis-5f49dd47fc-gw9gh         7m           16Mi
```

せっかく立てたので作業中の進捗などをつぶやくようにしていきたいですね。まあ、Obsidian との使い分けが難しそうですが...
