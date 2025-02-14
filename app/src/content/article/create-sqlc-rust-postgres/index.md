---
title: "Rust用のsqlcプラグインを書いた"
createdAt: "2025-02-14"
emoji: "⛓️"
category: "tech"
tags:
  - Rust
  - sqlc
---

## はじめに

Rustの`postgres`用のsqlcプラグインを作ったので、その紹介です

https://github.com/tunamaguro/sqlc-rust-postgres

## 作った経緯

今回作成した主な理由は、Rust向けのsqlcプラグインを私が見つけられなかったためです。個人的にSQLを直接記述するスタイルが好みで、
このスタイルを実現するためのツールとして[Cornucopia](https://github.com/cornucopia-rs/cornucopia)がありました。
ですが、2025年現在すでにメンテナンスが終了していたため終了していたため、今回自身でプラグインを書くことにしました

## 実際の使用例

セットアップ方法はリポジトリをご覧ください。生成されるコード(`queries.rs`)は次のように使うことができます。
この例では`tokio-postgres`用に`async`なコードが生成されていますが、`postgres`向けのコードも生成できます

```rust
#[allow(warnings)]
pub(crate) mod queries;

#[cfg(test)]
mod tests {
    use crate::queries;
    use test_context::test_context;
    use test_utils::PgTokioTestContext;

    async fn migrate_db(client: &tokio_postgres::Client) {
        client
            .batch_execute(include_str!("./schema.sql"))
            .await
            .unwrap();
    }

    #[test_context(PgTokioTestContext)]
    #[tokio::test]
    async fn queries_works(ctx: &mut PgTokioTestContext) {
        migrate_db(&ctx.client).await;
        let res = queries::create_author(&ctx.client, "FOO", Some("BAR"))
            .await
            .unwrap();
        assert_eq!(res.authors_name, "FOO");
        assert_eq!(res.authors_bio.as_ref().unwrap(), "BAR");

        let author = queries::get_author(&ctx.client, &res.authors_id)
            .await
            .unwrap();

        assert_eq!(res.authors_name, author.authors_name);
        assert_eq!(res.authors_bio, author.authors_bio);

        let authors_list = queries::list_authors(&ctx.client)
            .await
            .unwrap()
            .collect::<Vec<_>>();
        assert_eq!(authors_list.len(), 1);

        queries::delete_author(&ctx.client, &author.authors_id)
            .await
            .unwrap();

        let authors_list = queries::list_authors(&ctx.client)
            .await
            .unwrap()
            .collect::<Vec<_>>();
        assert_eq!(authors_list.len(), 0);
    }
}
```

## その他の特徴

### 生成されるコードが`postgres`関連クレート以外に依存しない

このプラグインで生成されるコードは基本的に[postgres](https://crates.io/crates/postgres)、[tokio-postgres](https://crates.io/crates/tokio-postgres)、[postgres-types](https://crates.io/crates/postgres-types)以外に依存しません。
そのため、生成されるコードを使うために新しい依存を追加しなくて済みます。

> これを作り始めた際[easeq/sqlc-rust](https://github.com/easeq/sqlc-rust)というRust向けのプラグインが既にありましたが、
> 追加の依存が必要なコードを生成していました。この点が好みではなかったので新しく作ることにしました

### DBの型とRustの型を指定可能

これは本家sqlcに存在する[overrides](https://docs.sqlc.dev/en/stable/howto/overrides.html)を意識しています。
[postgres-types](https://crates.io/crates/postgres-types)の`ToSql`や`FromSql`が実装された型を指定することで、複合型にも対応できます。
使い方は次のように、DBの型とRustの型をオプションで指定するだけです。ここで書いた値がそのまま生成されたコードに埋め込まれます

```json
{
  "version": "2",
  "plugins": [
    {
      "name": "rust-postgres",
      "wasm": {
        "url": "https://github.com/tunamaguro/sqlc-rust-postgres/releases/download/v0.1.1/sqlc-rust-postgres.wasm",
        "sha256": "1494046af973c4f6da87d0b8e50e906fb7e0ecf8417ed12a18780dbd4380d8c8"
      }
    }
  ],
  "sql": [
    {
      "schema": "examples/custom_type/src/schema.sql",
      "queries": "examples/custom_type/src/query.sql",
      "engine": "postgresql",
      "codegen": [
        {
          "out": "examples/custom_type/src",
          "plugin": "rust-postgres",
          "options": {
            "use_async": true,
            "overrides": [
              {
                "db_type": "voiceactor",
                "rs_type": "crate::VoiceActor" // <- 自作の複合型実装
              },
              {
                "db_type": "money",
                "rs_type": "postgres_money::Money" // <- 他のクレートの型も利用可能
              },
              {
                "db_type": "pg_catalog.numeric",
                "rs_type": "rust_decimal::Decimal"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

### 生成される構造体の`derive`を追加できる

オプションの`row_derives`に値を追加すると、返値の型として生成される構造体の`derive`部分を増やせます。
利用している[prost](https://github.com/tokio-rs/prost/issues/1064)が似たようなことができたので、実装しました

## 今後の改善予定

時間があれば以下の点を行う予定です

- コードのリファクタリング
- `enum`や型名に`!?`のような文字が含まれているとエラーになる問題の修正
- エラーメッセージの改善
- 生成される構造体のプロパティ名をより短くする
- 引数の数が多いとき`XXXArgs`のような構造体にまとめる
- [sqlx](https://github.com/launchbadge/sqlx)や[Cloudflare D1](https://docs.rs/worker/latest/worker/d1/index.html)への対応

## 感想

sqlcプラグインを実装するにあたり以下のサイトを非常に参考にさせてもらいました。ありがとうございます  
https://orisano.hatenablog.com/entry/2023/09/06/010926
