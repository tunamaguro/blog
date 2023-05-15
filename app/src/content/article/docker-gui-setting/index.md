---
title: "docker内でGUIを使おうと色々した話"
createdAt: "2023-02-11"
emoji: "💻️"
tags: ["tech"]
---

## はじめに

最近 Docker 内で GUI を使おうと思い色々調べたので、それのメモです。

参考までに筆者の環境は以下のとおりになっています。

- OS
  - Windows 11 Home 22H2
- WSL(一部割愛)
  - WSL バージョン: 1.0.3.0
  - カーネル バージョン: 5.15.79.1
  - WSLg バージョン: 1.0.47
    > `wsl -v` で確認できます。ない人は`wsl --update` をしてみてください
- Docker
  - Docker Desktop 4.16.3
  - Docker version 20.10.22
  - Docker Compose version v2.15.1

今回は`WSLg`を使う例、および`VNC`を使う例を紹介します。

## WSLg を使う方法

### WSLg is 何?

[WSL その 222 - Linux GUI アプリを動かす WSLg のアーキテクチャーと仕組み](https://kledgeb.blogspot.com/2021/04/wsl-222-linux-guiwslg.html)を見るとなんとなく御理解いただけるのではないかなと思います。

![WSLg-diagram](/images/docker-gui-setting/wslg-diagram.png)

上記ブログでも紹介されている[Microsoft のブログ](https://devblogs.microsoft.com/commandline/wslg-architecture/)から図を拝借してきました。普段使用しているディストリビューションの一部が書き換えられて、裏で動作している GUI 用のサーバーに接続しているようです。そしてこのサーバーからリモートデスクトップを使ってホスト(つまり Windows)と通信しているのだと思います。

> 図を見て「X とは?」となった方は[gihyo 様の記事](https://gihyo.jp/admin/serial/01/ubuntu-recipe/0717)を確認すると何となく理解できると思います

試しに`DISPLAY`などの環境変数を見てみると

```bash
$ printenv DISPLAY WAYLAND_DISPLAY XDG_RUNTIME_DIR PULSE_SERVER
:0
wayland-0
/mnt/wslg/runtime-dir
/mnt/wslg/PulseServer
```

確かに GUI 用のサーバーに接続するように設定されているようです。

### Docker の設定

以下のような`Dockerfile`と`compose.yaml`を準備してください、「Docker Compose なぞ使わねえ!」という方は適時`docker -v`などに読み替えてください。たぶん動くと思います。

- `Dockerfile`

```docker
# devcontainerを使いたかったのでこのイメージを使ってますが、
# 通常の用途では`ubuntu:20.04`とかを使うといいと思います
FROM mcr.microsoft.com/vscode/devcontainers/base:debian

# 動作確認用です。不要なら削除してください
RUN apt-get update -y && \
    apt install -y \
    x11-apps
```

- `compose.yaml`

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    command: sleep infinity
    environment:
      - DISPLAY=$DISPLAY
      - WAYLAND_DISPLAY=$WAYLAND_DISPLAY
      - XDG_RUNTIME_DIR=/tmp
      - PULSE_SERVER=$PULSE_SERVER
    volumes:
      - type: bind
        source: /tmp/.X11-unix
        target: /tmp/.X11-unix
      - type: bind
        source: "${XDG_RUNTIME_DIR}/wayland-0"
        target: /tmp/wayland-0
```

`docker compose up`してコンテナを立ち上げ、`docker compose exec app bash`でコンテナ内に入ります。

一応ここでも環境変数がどうなっているか軽く確認します。

```bash
$ printenv DISPLAY WAYLAND_DISPLAY XDG_RUNTIME_DIR PULSE_SERVER
:0
wayland-0
/tmp
/mnt/wslg/PulseServer
```

ちゃんと設定されている風ですね。試しに`xeyes`を使ってみます。

```bash
$ xeyes
```

![xeyes実行結果](/images/docker-gui-setting/wslg-xeyes.png)

ちゃんと画面が出てきました!!。軽くしか試していませんが２つ以上ウィンドウを立ち上げても問題ないようです。

![2つのウィンドウ](/images/docker-gui-setting/wslg-2-window.png)

docker 内で日本語化の設定などをすれば、おそらく日本語入力などもできると思います(未検証)。

## VNC を使う方法

そもそも大抵の要望は 👆 の`WSLg`で問題ないと思います。なのでほとんどの方はここを読む必要がありません。ですが特定のユースケース、例えばスクリーンショットを取る等の必要があればこちらを選ぶと良いと思います。

### VNC is 何?

調べる中で`VNC`を使ってもできるという情報があったのですが、私はそもそも初めて聞く言葉だったのでちょっと調べます。

[辞書](https://e-words.jp/w/VNC.html)によると、RFB と呼ばれるプロトコルを用いてデスクトップ画面や、キーボードなどの入出力をネットワーク越しに通信するソフトウェアの総称だそうです。音声通信も調べた限りできるっぽいです。

### Docker の設定

これに関してはいい感じのイメージがあったのでこれを使えば以下の面倒な設定は不要です。

- [docker-ubuntu-vnc-desktop](https://github.com/fcwu/docker-ubuntu-vnc-desktop)

今回は自分で組む経験を積みたいので Dockerfile から書いていきます。

(再掲)以下のような`Dockerfile`と`compose.yaml`を準備してください、「Docker Compose なぞ使わねえ!」という方は適時`docker -v`などに読み替えてください。たぶん動くと思います。

- `Dockerfile`

```docker
# devcontainerを使いたかったのでこのイメージを使ってますが、
# 通常の用途では`ubuntu:20.04`とかを使うといいと思います
FROM mcr.microsoft.com/vscode/devcontainers/base:debian

ENV DISPLAY=:1
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update -y && \
    apt install -y --no-install-recommends \
    x11-apps \
    # 好みで適当なGUIに変えてください
    lxde \
    # 好みでここも好きなVNCに変えられます
    tigervnc-standalone-server \
    tigervnc-common \
    # NoVNC
    novnc \
    websockify
```

- `compose.yaml`

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    command: sleep infinity
    ports:
      - 7001:80
```

先ほどど同様の手順でコンテナ内に入り、TigerVNC or お好きな VNC を起動します。

[TigerVNC](https://tigervnc.org/)

```bash
$ USER=root vncserver :1 -geometry 800x600 -depth 24
```

![vncserver](/images/docker-gui-setting/vnc-vncserver.png)

`root`でユーザを作成し解像度 800x600 の VNC デスクトップを立ち上げています。`depth`の意味はよくわかっていません。パスワード入力してくださいと言われたら、適当なパスワードを設定します。

> `vncserver -list`で現在の VNC デスクトップを確認できます。また、`vncserver -kill :x`で対象の VNC デスクトップを削除できます。

![vnclist](/images/docker-gui-setting/vnc-vnclist.png)

5901 番のポートにサーバーが立っているので、localhost:5901 を指定します。

```bash
$ websockify -D --web=/usr/share/novnc/ 80 localhost:5901
```

![websockify](/images/docker-gui-setting/vnc-websockify.png)

ここまで実施したら、ホスト PC から[localhost:7001/vnc.html](http://localhost:7001/vnc.html)にアクセスすると...

![novnc](/images/docker-gui-setting/vnc-novnc.png)

`NoVNC`の画面が表示されるので、Connect を押して先程設定したパスワードを入力します。すると、コンテナ内の GUI が表示されます。

![guiからxcalc](/images/docker-gui-setting/vnc-gui-terminal.png)

👆 は`xcalc`を実行してみた例です。コンテナ内のターミナルから実行しても問題なく表示されています。

![terminalからxeyes](/images/docker-gui-setting/vnc-gui-xeyes.png)

ブラウザだけで GUI が使えるのは便利です。

### 音声について

[この Issue](https://github.com/novnc/noVNC/issues/302)よると**NoVNC は**音声もサポートしている or その実装があるっぽいですが、そもそも VNC 側で対応しているサーバが少ないようです。

音声だけは上の`WSLg`でやったように`PULSE_SERVER`で送るのがいいかもしれませんが、今回は検証していないので実際にできるかどうかわかりません。

## 終わりに

`WSLg`を使った例は Mac を使っている方にはできないので、そういう意味では`VNC`を使ったほうが良いのかもしれませんが、
パフォーマンス的なあれそれがちょっと気になります。そもそも、Docker と GUI の相性があまり良くないのかもしれません。

## 参考

これは以下の素晴らしい記事を参考に作成されました。

- [WSLg と docker compose で全部やる](https://zenn.dev/ysuito/articles/7693a3c1934fb4)
- [VNC で Docker コンテナ内の GUI デスクトップにアクセスしてみた](https://kamino.hatenablog.com/entry/docker_vnc)
