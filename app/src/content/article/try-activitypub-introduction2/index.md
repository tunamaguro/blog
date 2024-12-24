---
title: "ActivityPubに入門してみた"
createdAt: "2024-12-22"
updatedAt: "2024-12-24"
emoji: "🐧"
category: tech
tags:
  - ActivityPub
---

## はじめに

これは[Fediverse Advent Calendar 2024](https://adventar.org/calendars/10242)の22日目の記事です

[以前Activity Pubの初歩の初歩として簡単なチュートリアル](/articles/try-activitypub-introduction)をやっていました。
今回はその発展として、きちんとユーザのフォローなどをDBに記録するだけの簡単なサーバを書いたので、記録を残します。

リポジトリは以下にあります

https://github.com/tunamaguro/apub-lite

## 作ったモノの機能

現状実装できているのは、以下の3つだけです

- 他サーバからアクターが見える
- 他のサーバからの`Follow`を`Accept`できる
- フォロワーにノートを送信できる

`Object`や`Action`を一切記録していないので、作成された`Note`は相手方のサーバにしか保存されません

## 初歩から追加したところ

### `Follow`周りの処理の実装

よその`Actor`から`Follow`されたとき、`Accept`を`Follow`してきた`Actor`のインボックスに投げる、
相手にフォローが承認されたことを伝えることができます。このあたりの流れは[ActivityPubまとめWiki](https://scrapbox.io/activitypub/%E3%83%95%E3%82%A9%E3%83%AD%E3%83%BC%E3%81%AE%E6%B5%81%E3%82%8C)と、
[Matchbox](https://gitlab.com/acefed/matchbox)を参考にしました。
言葉でもシンプルなので、実装も以下のようにとてもシンプルです

```rust
    match kind {
        InboxKinds::Follow(follow) => {
            let follow_person = activity_service
                .get_actor_by_url(follow.actor.as_ref())
                .await?;

            let follower_repo = registry.follower_repository();

            follower_repo
                .create(&user.id, &follow_person.actor_url)
                .await?;

            let accept = Accept::builder()
                .actor(user.user_uri(&config))
                .id(generate_activity_uri(&config).into())
                .object(follow)
                .context(Default::default())
                .build();

            activity_service
                .post_activity(&accept, &follow_person.inbox, &signing_key, &user_key_id)
                .await?;
            tracing::info!(kind = "Accept", actor = %follow_person.actor_url, object = user.name);
        }
```

Ref: https://github.com/tunamaguro/apub-lite/blob/410c94d95748b023a59a3b337ccf2e71bbff810f/crates/apub-api/src/handler/inbox.rs#L63-L82

この実装では、`Follow`に対して何かしらレスポンスを返す前に`Accept`を投げていますが、[これでも一応問題ないみたいです](https://github.com/tunamaguro/apub-lite/pull/17)

### フォロワーへのノート配信

今回はシンプルな実装なのでDBからフォロワーの一覧を取得し、それぞれのインボックスに1つずつ`Create`を送信しています。
この際、自身が作成したことを証明するため[HTTP Message Signatures(draft 15)](https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-message-signatures-15)による署名をして送る必要があります。
これは初歩の初歩でやったことと基本的に同じです。

(私が簡単に調べた限り)Mastodonは最新の仕様である[RFC9421](https://datatracker.ietf.org/doc/html/rfc9421)に準拠していないため、少し古めの仕様を見て実装する必要がありました。
ただ、将来的にすべてのサーバが対応していけば、この古めの規格に従う必要はなくなるのではないかと思っています

## 実装してみた感想

[RustによるWebアプリケーション開発](https://www.amazon.co.jp/Rust%E3%81%AB%E3%82%88%E3%82%8BWeb%E3%82%A2%E3%83%97%E3%83%AA%E3%82%B1%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%B3%E9%96%8B%E7%99%BA-%E8%A8%AD%E8%A8%88%E3%81%8B%E3%82%89%E3%83%AA%E3%83%AA%E3%83%BC%E3%82%B9%E3%83%BB%E9%81%8B%E7%94%A8%E3%81%BE%E3%81%A7-KS%E6%83%85%E5%A0%B1%E7%A7%91%E5%AD%A6%E5%B0%82%E9%96%80%E6%9B%B8-%E8%B1%8A%E7%94%B0-%E5%84%AA%E8%B2%B4/dp/4065369576)を読んだので、何か動くものを実装してみたくなりこれに至りました。
パフォーマンスなどもろもろのことを見なかったことにすれば、実装自体は簡単なので練習にはちょうどよかったと思います。
また、ちょうどMastodonやMisskeyの裏で動いている仕組みが気になっていたので、それを何となく知れて良かったです。

一応`Note`および`Create`を保存するようにしたところで、これはおしまいにするつもりです。ただ、時間があればCloudflare Workerで動くようにするところまでやるかもしれません
