---
title: "ブログを作り直しました"
createdAt: "2022-12-27"
emoji: "👋"
category: "blog"
tags:
  - Gatsby
  - daisyUI
  - Tailwind CSS
---

以前まで使っていたブログの見た目があんまりにも残念だったので、作り直しました。

## 作り直すのに使ったもの

ソースコードはこちらになります。[https://github.com/tunamaguro/blog](https://github.com/tunamaguro/blog)

### フレームワーク

[Gatsby](https://www.gatsbyjs.com/)  
![Gatsby Logo](src/assets/images/rework-entry/Gatsby-Logo.png)  
今回もフレームワークには Gatsby を使いました、本当は Next.js で作りたかったですが、 かかる時間と僕のやる気を鑑みてやめました。
そのうち、Next.js で作り直すつもりです。(いつになることやら...)  
使用感としては、gatsby のプラグインが面倒くさい部分を行っていてくれていて非常に楽でした。ただ、そこらへんを自分で設定できないからこそ、自分がよわよわプログラマーなんだと強く感じました。

### スタイリング

[daisyUI](https://daisyui.com/)  
👆 で書いたようにいつか Next.js に置き換えたかったので、なるべく移植が楽になるように css だけでのスタイリングをしたいなと思っていました。
そこでいつものように Zenn を見ていたら[daisyUI の記事](https://zenn.dev/ikenohi/articles/596594edebb76f)を見つけ、「これしかない!」と採用しました。  
使用感としては、class 名を書くだけで素晴らしい見た目がついてきて最高でした。ちょっとした修正も tailwind を当てるだけでできるので、次回サイトを作るときも使いたいと思います。  
ところで、似たようなライブラリに[headless UI](https://headlessui.com/)があります。これも便利そうなのでどこかで使いたいです。

### その他

デザインに関しては、[Zenn](https://zenn.dev/)を参考にしました。(ほぼパクりました)  
なので、特にこの記事ページとかはありえないぐらい似てます。(すみません)

## 感想

### 見た目=やる気 🔥

前回までの見た目は残念すぎて、まったく記事を書こうという気になれませんでした。それの理由は人に見せるためのブログなのに人に見せられない見た目だからだと思っています。(もちろんやる気不足でもあります)  
今回はいい感じの見た目ができたと思っているので(自画自賛)、なんとか 2 記事/1 月を目指して頑張っていきます。

### やる気の都合で実装できなかったこと

- レスポンシブデザイン
- コードブロックタイトルの見た目
- タグ検索機能
- 読了時間の表示
- ブログ一覧ページでページネーション(それをするほど記事がない)
- サイトの OGP
- サイトマップや RSS の設定

そのうちやります。
