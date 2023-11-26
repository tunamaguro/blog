---
title: "TauriをDockerを使ってなるべく簡単に始める"
createdAt: "2023-05-07"
emoji: "🐳"
category: "tech"
tags:
  - Docker
  - Tauri
---

## はじめに

最近（私の中で）話題になっている GUI フレームワーク、[Tauri](https://tauri.app/)。つい先日の 5 月 3 日には`1.3.0` が発表されました。  
そんな新しそうなものには、触ってみずにはいられないので今回は`Docker`を使って`Tauri`の環境づくりを行ってみます。

## 筆者の環境

- OS
  - Windows 11 Home 22H2
- WSL(一部割愛)
  - WSL バージョン: 1.0.3.0
  - カーネル バージョン: 5.15.79.1
  - WSLg バージョン: 1.0.47
  - Distribution: Ubuntu 22.04
- Docker
  - Docker Desktop 4.16.3
  - Docker version 20.10.22
  - Docker Compose version v2.15.1

## 最終的な構成

「俺は結果だけ知りたいんじゃ!」という方のために最終的な構成をここに置いておきます。

```docker
FROM rust:1.69-slim-bullseye

ARG USERNAME=developer
ARG GROUPNAME=developer
ARG UID=1000
ARG GID=1000
ARG PASSWORD=password

# Add user for develop
# If you  don't need, please comment out
RUN apt-get update -y && apt-get install -y sudo && \
    groupadd -g $GID $GROUPNAME && \
    useradd -m -s /bin/bash -u $UID -g $GID -G sudo $USERNAME && \
    echo $USERNAME:$PASSWORD | chpasswd && \
    echo "$USERNAME   ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Tauri dependencies
# See https://tauri.app/v1/guides/getting-started/prerequisites#setting-up-linux
RUN apt-get update  && \
    apt-get install -y \
    libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev

# Install Node.js
# See https://github.com/nodesource/distributions
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - &&\
    apt-get install -y nodejs

# Add user for develop
# If you  don't need, please comment out
USER $USERNAME

```

## Tauri に必要な諸々の準備

### Webkit などのインストール

今回は rust`の公式イメージをベースに作成します。公式サイトを見てみると C++コンパイラや Webkit 関連をインストールしなくてはならないようなので、これをインストールします。

https://tauri.app/v1/guides/getting-started/prerequisites#setting-up-linux

```docker
FROM rust:1.69-slim-bullseye

# Tauri dependencies
# See https://tauri.app/v1/guides/getting-started/prerequisites#setting-up-linux
RUN apt-get update -y && \
    apt-get install -y \
    libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
```

### Node.js のインストール

続いて`Node.js`もインストールします。これは前提条件に書かれていませんが、あとで`Vite`や`Next.js`を使いたいのでここでもう入れておきます。

```docker
# 略...

# Install Node.js
# See https://github.com/nodesource/distributions
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - &&\
    apt-get install -y nodejs
```

この段階でいったんコンテナを立ち上げて動かしてみます。

```bash
docker build . -t tauri-docker
```

```bash
docker run -it --rm tauri-docker /bin/bash
```

試しに`Rust`、`Node.js`のバージョンを見てみます。

```bash
rustc --version
rustc 1.69.0 (84c898d65 2023-04-16)
```

```bash
node -v
v20.1.0
```

## その他の設定

### WSLg の設定

> ここは Windows の方向けです。Mac や Linux の方は以下のような記事を見ながらやられるとうまくいくんじゃないかなと思います。
> https://zenn.dev/hogenishi/articles/6bcffa389bcfb6

普通の Web 開発とは違い GUI を動かすために`WSLg`の設定を行います。
[以前](/articles/docker-gui-setting/)行ったように`DISPLAY`環境変数などをコンテナに渡します。

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

コンテナを起動し`xeyes`を動かしてみます。

```bash
docker compose up -d
```

```bash
docker compose exec app /bin/bash
```

```bash
apt-get update && apt-get install -y x11-apps
```

```bash
xeyes
```

目玉が表示されていれば OK です。

### 開発用ユーザの追加

ちょっと蛇足ですがコンテナで利用しているユーザが`root`のために、すべて管理者権限で実行されるのが気に食わないので、開発用のユーザをここで追加しておきます。

> `sudo`は問題が起きるとつらそうなので必要なければ入れなくてもいいかもしれません
> https://docs.docker.jp/engine/articles/dockerfile_best-practice.html#user

- 現状の`Dockerfile`

```docker
FROM rust:1.69-slim-bullseye

ARG USERNAME=developer
ARG GROUPNAME=developer
ARG UID=1000
ARG GID=1000

# Add user for develop
# If you  don't need, please comment out
RUN apt-get update -y && apt-get install -y sudo && \
    groupadd -g $GID $GROUPNAME && \
    useradd -m -s /bin/bash -u $UID -g $GID -G sudo $USERNAME && \
    echo $USERNAME:$PASSWORD | chpasswd && \
    echo "$USERNAME   ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Tauri dependencies
# See https://tauri.app/v1/guides/getting-started/prerequisites#setting-up-linux
RUN apt-get update -y && \
    apt-get install -y \
    libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev

# Install Node.js
# See https://github.com/nodesource/distributions
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - &&\
    apt-get install -y nodejs

USER $USERNAME
```

これは実施しなくとも問題ないと思います。もし、この設定を行う場合はコンテナをビルドしなおしておいてください。

## Tauri のチュートリアルをやってみる

先ほどまでですべての準備が完了したので、実際に`Tauri`を動かしてみます。基本的には下の内容の通りに進め、これからのコマンドはすべてコンテナ内で実行します。

https://tauri.app/v1/guides/getting-started/setup/vite

公式がアプリを作るための scaffold を用意してくれているので、それを利用してアプリの雛形を生成します。今回は始めるのが簡単な`React`+`Vite`で行きます。

```bash
npm create tauri-app@latest

✔ Project name · tauri-app
✔ Choose which language to use for your frontend · TypeScript / JavaScript - (pnpm, yarn, npm)
✔ Choose your package manager · npm
✔ Choose your UI template · React - (https://reactjs.org/)
✔ Choose your UI flavor · TypeScript
```

表示されたコマンドの通りに実行します。はじめは諸々のインストールが行われるので時間がかかりますが、2 回目以降はかなり早く実行できます。

```bash
cd tauri-app
npm install
npm run tauri dev
```

下のような画面が表示されれば成功です!  
![welcome Tauri](src/assets/images/tauri-docker/welcome-tauri.png)

## まとめ

本当は`Tauri Mobile`の実行も`Docker`の中で行いたかったですがまだうまくいってません。  
正直自己満足に近い記事ですが、誰かのお役に立てば幸いです。
