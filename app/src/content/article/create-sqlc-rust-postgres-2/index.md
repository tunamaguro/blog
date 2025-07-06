---
title: "Rust用のsqlcプラグインを書きなおした"
createdAt: "2025-07-06"
emoji: "🐶"
category: "tech"
tags:
  - Rust
  - sqlc
---

## はじめに

[以前作った`postgres`用のsqlcプラグイン](/articles/20250214-Rust用のsqlcプラグインを書いた)を書き直して、[sqlx](https://github.com/launchbadge/sqlx)にも対応させたので紹介します。リポジトリは以下です

https://github.com/tunamaguro/sqlc-gen-rust

## 特徴

### 4つのPostgresql系クレートに対応

`postgres`,`tokio-postgres`,`deadpool-postgres`,`sqlx(postgres)`という計4つのクレートに対応しています。とくに書き直し前は`sqlx`に対応していなかったため、ここは差別化ポイントです。
各クレートごとに生成されるコードはRustのトレイトを活用して、なるべく汎用的なコードになるよう意識しました。生成されるコードへのリンクを貼ります

- [`postgres`用のコード](https://github.com/tunamaguro/sqlc-gen-rust/tree/main/examples/e-commerce/src/postgres_query.rs)
- [`tokio-postgres`用のコード](https://github.com/tunamaguro/sqlc-gen-rust/tree/main/examples/e-commerce/src/tokio_query.rs)
- [`deadpool-postgres`用のコード](https://github.com/tunamaguro/sqlc-gen-rust/tree/main/examples/e-commerce/src/deadpool_query.rs)
- [`sqlx-postgres`用のコード](https://github.com/tunamaguro/sqlc-gen-rust/tree/main/examples/e-commerce/src/sqlx_query.rs)

### 構造体とビルダーベースのクエリ実行

もともとは関数をベースとしたコードを生成していましたが、Rustっぽく構造体とビルダーをベースとしたコードを生成します。もちろん、`String`などは`&str`のような参照を取りコストが低くなるようになっています

```rust
pub struct GetAuthor {
    id: i64,
}
impl GetAuthor {
    pub const QUERY: &'static str = r"SELECT id, name, bio FROM authors
WHERE id = $1 LIMIT 1";
    pub async fn query_one(
        &self,
        client: &impl tokio_postgres::GenericClient,
    ) -> Result<GetAuthorRow, tokio_postgres::Error> {
        let row = client.query_one(Self::QUERY, &[&self.id]).await?;
        GetAuthorRow::from_row(&row)
    }
    pub async fn query_opt(
        &self,
        client: &impl tokio_postgres::GenericClient,
    ) -> Result<Option<GetAuthorRow>, tokio_postgres::Error> {
        let row = client.query_opt(Self::QUERY, &[&self.id]).await?;
        match row {
            Some(row) => Ok(Some(GetAuthorRow::from_row(&row)?)),
            None => Ok(None),
        }
    }
}
impl GetAuthor {
    pub const fn builder() -> GetAuthorBuilder<'static, ((),)> {
        GetAuthorBuilder {
            fields: ((),),
            _phantom: std::marker::PhantomData,
        }
    }
}
pub struct GetAuthorBuilder<'a, Fields = ((),)> {
    fields: Fields,
    _phantom: std::marker::PhantomData<&'a ()>,
}
impl<'a> GetAuthorBuilder<'a, ((),)> {
    pub fn id(self, id: i64) -> GetAuthorBuilder<'a, (i64,)> {
        let ((),) = self.fields;
        let _phantom = self._phantom;
        GetAuthorBuilder {
            fields: (id,),
            _phantom,
        }
    }
}
impl<'a> GetAuthorBuilder<'a, (i64,)> {
    pub const fn build(self) -> GetAuthor {
        let (id,) = self.fields;
        GetAuthor { id }
    }
}
```

> FYI: https://github.com/tunamaguro/sqlc-gen-rust/blob/b540b5140e46bf884585cca86814723094e0be62/examples/authors/src/queries.rs#L25-L76

これを使う場合次のようになります。型状態ベースのビルダーのため、引数を忘れている場合エラーになります。型状態ビルダーの実装は[typed-builder](https://github.com/idanarye/rust-typed-builder)を参考にしました

```rust
let author = GetAuthor::builder()
    .id(1)
    .build()
    .query_one(&client)
    .await?;

// let author = GetAuthor::builder() // 引数を設定しない場合`GetAuthorBuilder<'a,(())>`が推論され、これに`build`は実装されていないためエラー
//     .build()
//     .query_one(&client)
//     .await?;

```

## 実装的に工夫した箇所

エラーメッセージがわかりやすくなるように、[Greptimeのブログ](https://greptime.com/blogs/2024-05-07-error-rust)を参考に、`StackError`を実装しています。
実際に生成されるエラーメッセージの例を以下に示します

```bash
error generating code: generation failed.
0:Cannot map type `timestamptz` of table `users.created_at` to a Rust type. Consider add entry to overrides. , at src/lib.rs:331
1: at src/query.rs:372
2: at src/query.rs:221
3:Cannot map type `timestamptz` of table `users.created_at` to a Rust type. Consider add entry to overrides. , at src/query.rs:219
```

エラーが発生した位置まで、どのように関数が呼び出されていたか一目瞭然です。実装としてはそれぞれのエラーに対して`std::panic::Location`を持たせており、
そこで得た位置情報を`StackError`トレイトを経由して表示する形です。それぞれのエラーが`StackError`を実装しているため、再帰的に`format_stack`を呼び出すことで上のエラーメッセージができます。

```rust
pub trait StackError: std::error::Error {
    /// format each error stack
    fn format_stack(&self, layer: usize, buf: &mut Vec<String>);
    /// next error
    fn next(&self) -> Option<&dyn StackError>;

    /// last error
    fn last(&self) -> &dyn StackError
    where
        Self: Sized,
    {
        let Some(mut result) = self.next() else {
            return self;
        };
        while let Some(err) = result.next() {
            result = err;
        }
        result
    }
}

pub trait StackErrorExt: StackError {
    fn stack_error(&self) -> Vec<String>
    where
        Self: Sized,
    {
        let mut buf = Vec::new();
        let mut layer = 0;
        let mut current: &dyn StackError = self;

        loop {
            current.format_stack(layer, &mut buf);
            match current.next() {
                Some(next) => {
                    current = next;
                    layer += 1;
                }
                None => break,
            }
        }

        buf
    }
}

impl<E: StackError> StackErrorExt for E {}
```

詳しい解説はGreptimeのブログに譲りますが、wasm環境というスタックトレースを取れない環境では良い選択肢だと考えています。

## 改善点

現状考えている改善点を挙げます

### `:copyfrom`に未対応

行う方法は調査して分かっているのですが、どのような形のAPIとするのが良いのか悩んでおり実装に入れていません

> FYI:[COPY FROM STDINを使う方法について](https://zenn.dev/tunamaguro/scraps/d5c42a7d32b5e5)

### `sqlx`で`Stream`を返せていない

`postgres`系では`:many`指定されたクエリに対して、`Stream`を返すメソッド`query_stream`が実装されますが、`sqlx`系は未対応です。
これは`sqlx`の`fetch`などが外部クレートである`futures::Stream`を直接返しているためです。使用する際に新しくクレートを追加せずサッと使えるように、生成されるコードは外部クレートへの依存を0を前提にしているので、
実装が行えませんでした。代替として`QueryAs`を返す関数を実装し利用者側で`fetch`を呼んでもらうことで、この問題の回避を試みています

```rust
impl ListUsers {
    pub const QUERY: &'static str = r"SELECT id, username, email, full_name, created_at FROM users
ORDER BY created_at DESC
LIMIT $1
OFFSET $2";
    pub fn query_as<'a>(
        &'a self,
    ) -> sqlx::query::QueryAs<
        'a,
        sqlx::Postgres,
        ListUsersRow,
        <sqlx::Postgres as sqlx::Database>::Arguments<'a>,
    > {
        sqlx::query_as::<_, ListUsersRow>(Self::QUERY)
            .bind(self.limit)
            .bind(self.offset)
    }
    pub fn query_many<'a, 'b, A>(
        &'a self,
        conn: A,
    ) -> impl Future<Output = Result<Vec<ListUsersRow>, sqlx::Error>> + Send + 'a
    where
        A: sqlx::Acquire<'b, Database = sqlx::Postgres> + Send + 'a,
    {
        async move {
            let mut conn = conn.acquire().await?;
            let vals = self.query_as().fetch_all(&mut *conn).await?;
            Ok(vals)
        }
    }
}
```

利用者側は次のようになり、利用者がStreamを使うかどうかの選択を委ねています

```rust
use futures::TryStreamExt;

let user_query = sqlx_query::ListUsers::builder()
    .limit(100)
    .offset(0)
    .build();

let mut user_stream = user_query.query_as().fetch(&pool);

while let Some(user) = user_stream.try_next().await.unwrap() {
    todo!("Do something")
}
```

> 生成されたコード: https://github.com/tunamaguro/sqlc-gen-rust/blob/main/examples/e-commerce/src/sqlx_query.rs#L257-L287  
> sqlxのドキュメント: https://docs.rs/sqlx/latest/sqlx/query/struct.QueryAs.html#method.fetch

### 列レベルでの型のオーバライドに未対応

本家sqlcは列レベルで型を上書きできます。このプラグインでも同じことができれば、とくにJSONを格納している列に対して自動でデシリアライズができるので、かなり便利になると考えています

## 終わりに

本家[sqlc](https://github.com/sqlc-dev/sqlc)の開発が最近活発でなさそうなので、本番利用は怖いですが趣味レベルではSQLの知識をフルに使えるsqlcは良いアプローチだと思っています。
今後どうなるかはわかりませんが、おそらく使用者は自分しかいないのでこつこつメンテナンスしていきます
