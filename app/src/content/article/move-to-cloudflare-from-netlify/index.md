---
layout: "@/layouts/MdLayout.astro"
title: "NetlifyからCloudflareに引っ越しました"
date: "2023-02-05"
emoji: "🏡"
tags: ["blog"]
---

## はじめに

先日以下の記事を読んで真似したくなったので、練習も兼ねて Cloudflare Pages に移行しました。

[日本国内だと Netlify より Cloudflare Pages の方が速い！](https://qiita.com/akitkat/items/dcbe4fcaacc051753e2b)

これで少しでも早くなってると嬉しいです。

## やったこと

作業のほとんどを以下の記事を参考に行いました。ありがとうございます!!

- [Cloudflare Pages で Gatsby を動かすのは案外難しい](https://zenn.dev/appare45/articles/cloudflarepages-gatsby)
- [GitHub Actions でビルドして Cloudflare Pages にデプロイする](https://zenn.dev/nwtgck/articles/1fdee0e84e5808)

そのほかの参考リンクは[このイシュー](https://github.com/tunamaguro/blog/issues/26)にすべて貼ってあります。

### Cloudflare Pages にデプロイ

以下の記事を参考にデプロイの設定を行いました。やりたかったことがほぼ書かれていて非常に助かりました。

[GitHub Actions でビルドして Cloudflare Pages にデプロイする](https://zenn.dev/nwtgck/articles/1fdee0e84e5808)

**GitHub Actions**を使うのは今回が初めてだったので良い勉強でした。

![GitHub Actionsの様子](/images/move-to-cloudflare-from-netlify/action-image.png)

ちゃんと動いているようです。

### ドメインの設定

**Netlify**に登録しているカスタムドメインを解除して、**Cloudflare Pages**にドメインを設定しました。

**Netlify**に比べてドメインの確認に時間がかかっており私の場合 15 分程度かかりました。

UI が良かったので迷うことはないと思いますが、一応公式のドキュメントを下に貼っておきます。

[Custom domains](https://developers.cloudflare.com/pages/platform/custom-domains/)

### Netlify 退会

もう使わなくなったので**Netlify**から退会します。

![サイトを消す](/images/move-to-cloudflare-from-netlify/delete-netlify.png)

## 終わりに

確かに気持ち Netlify より早い気がしますが...初心者感覚としてはそこまで劇的に変わったというほどではない気がします。

まあもともと勉強目的だったので少し早くなれば OK です。

今回始めて**GitHub Actions**を少し触りましたがすごい便利でした。これが無料というのがわりと信じられません。

次の作業では Prettier や ESLint などを実行して危ないコードがなるべくマージされないようにしたいと思います。

さて、次はどんな改良をこのブログにしましょうか...
