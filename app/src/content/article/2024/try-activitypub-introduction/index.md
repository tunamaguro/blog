---
title: "ActivityPubの初歩の初歩をやってみた"
createdAt: "2024-10-06"
emoji: "🎣"
category: tech
tags:
  - ActivityPub
---

## はじめに

最近ActivityPubが気になっているので、有名なチュートリアルをやってみただけの記録です

https://blog.joinmastodon.org/2018/06/how-to-implement-a-basic-activitypub-server/

実装したリポジトリはここです

https://github.com/tunamaguro/simple-activitypub

## 仕様について

> 簡単に調べただけの知識で書いているので間違っている可能性があります

ActivityPubは分散SNSを作るためのW3Cが定める規格です

https://www.w3.org/TR/activitypub/

> The ActivityPub protocol is a decentralized social networking protocol based upon the [ActivityStreams] 2.0 data format. It provides a client to server API for creating, updating and deleting content, as well as a federated server to server API for delivering notifications and content.

> ActivityPubプロトコルは、[ActivityStreams] 2.0データ形式に基づいた分散型ソーシャルネットワーキングプロトコルです。コンテンツの作成、更新、削除を行うためのクライアントからサーバーへのAPIと、通知やコンテンツを配信するためのサーバー間でのAPIを提供します。  
> (訳: ChatGPT)

日本語訳からわかるように、これはあくまでサーバ間の通信方法に関する規格で具体的にどのようなデータをやり取りするかは別の規格として定まっています

そのような関連規格として、以下のようなものがあります

- https://www.w3.org/TR/activitystreams-core/
  - どのような種類のデータが流れてくるか。また、どのようにそれを解釈すればよいかの規格
- https://www.w3.org/TR/activitystreams-vocabulary/
  - 具体的に流れてくるデータの規格

## 感想

チュートリアルも分かりやすく、実装も200行程度なので非常に簡単だと思います。実装するにあたって2つ感じたことがあるので記載します

### 他サーバと通信する際のつらみ

他のサーバと通信するにあたっては規格にない部分に関しては、
サーバの実装を確認する必要があるのがつらそうだなと感じています

たとえばMastodonのInboxにデータを送信する際、ヘッダーにリクエストのハッシュを入れる必要があります。
おそらくセキュリティ的なあれこれだと思うのですが、このヘッダーについてはActivityPubの規格にはないです（あったらすみません）。
複数サーバーと通信する場合、そこで動作しているアプリケーションを理解しないと通信できないのはもったいないような気がしています

https://docs.joinmastodon.org/spec/security/#digest

また、現在使われているHTTP SignatureもDraft状態で実装されているものがあるらしい（確認してません）ので、このあたりの互換性問題も面倒そうです

https://zenn.dev/tkithrta/articles/c9bb8a57b61b50

### デバッグが面倒

サーバーの正しさを確認する必要があるので当然といえば当然ですが、httpsが必要です。ですが、他のサーバと通信するために
毎回httpsを準備するのはかなり面倒でした。今回は[serveo](https://serveo.net/)を使ってローカルをhttpsで公開しましたが、
他にもっと良い方法がありそうです。コンテナでDNSと、ルート証明書を用意してやるのがいいんでしょうか？
単純に今開発されているアプリケーションがどのようにしているか気になります

## 終わりに

とりあえず、今回はチュートリアルをしただけでしたが、InboxのOutboxもどこかで実装してみたいです
