---
title: "Postgresへ大量挿入する場合のパフォーマンスを比較してみた"
createdAt: "2025-07-12"
emoji: "🐘"
category: "tech"
tags:
  - Rust
  - Postgres
---

## はじめに

PostgreSQLに大量のデータを挿入する際、どの方法がもっとも高速なのか気になったので、実際に100万件のデータを使ってベンチマークを取ってみました。
言語にはRustを、クレートは`sqlx`と`tokio-postgres`の2つを使い、それぞれ5つの異なる方法で比較しました。

## 注意

この記事はデータベースに対する知見がない初学者が書いています。そのため、誤った内容や適切でない測定方法を行っている可能性があります。
記事内容に関する指摘は歓迎いたしますが、この記事の内容を鵜吞みにせず、業務利用する前に公式ドキュメントを確認することを強く推奨します。

## 測定対象

以下の5つの方法でパフォーマンスを測定しました

1. バイナリ形式での`COPY FROM STDIN`
1. テキスト形式での`COPY FROM STDIN`
1. CSV形式での`COPY FROM STDIN`
1. 配列と`UNNEST`を使った一括挿入
1. プリペアドステートメントを使った挿入（10,000件ずつのバッチ）

計測コードは以下のリポジトリから確認できます

https://github.com/tunamaguro/postgres-insert-performance-comparison-rust

## 実装上の注意点

### `COPY FROM STDIN`でのバッファリング

`tokio-postgres`の`BinaryCopyWriter`は[内部でバッファリングをしています](https://docs.rs/tokio-postgres/0.7.13/src/tokio_postgres/binary_copy.rs.html#57-100)。
公平な比較のため、`sqlx`やバイナリ形式以外の書き込みでも同様にバッファリングを行っています。

> バッファリングせず毎回送信した場合、10倍以上遅くなりました

```rust
const BUFFER_SIZE: usize = 4096;
struct CopyDataSink<C: DerefMut<Target = PgConnection>> {
    encode_buf: PgArgumentBuffer,
    data_buf: Vec<u8>,
    copy_in: PgCopyIn<C>,
}

type BoxError = Box<dyn std::error::Error + 'static + Send + Sync>;

impl<C: DerefMut<Target = PgConnection>> CopyDataSink<C> {
    fn new(copy_in: PgCopyIn<C>) -> Self {
        let mut data_buf = Vec::with_capacity(BUFFER_SIZE * 2);
        const COPY_SIGNATURE: &[u8] = &[
            b'P', b'G', b'C', b'O', b'P', b'Y', b'\n', // "PGCOPY\n"
            0xFF,  // \377 (8進数) = 0xFF (16進数)
            b'\r', b'\n', // "\r\n"
            0x00,  // \0
        ];

        assert_eq!(COPY_SIGNATURE.len(), 11);
        data_buf.extend_from_slice(COPY_SIGNATURE); // 署名
        data_buf.extend_from_slice(&0_i32.to_be_bytes()); // フラグフィールド
        data_buf.extend_from_slice(&0_i32.to_be_bytes()); // ヘッダ拡張領域長

        CopyDataSink {
            encode_buf: Default::default(),
            data_buf,
            copy_in,
        }
    }

    async fn send(&mut self) -> Result<(), BoxError> {
        let _copy_in = self.copy_in.send(self.data_buf.as_slice()).await?;

        self.data_buf.clear();
        Ok(())
    }

    async fn finish(mut self) -> Result<u64, BoxError> {
        const COPY_TRAILER: &[u8] = &(-1_i16).to_be_bytes();

        self.data_buf.extend(COPY_TRAILER);
        self.send().await?;
        self.copy_in.finish().await.map_err(|e| e.into())
    }

    fn insert_row(&mut self) {
        let num_col = self.copy_in.num_columns() as i16;
        self.data_buf.extend(num_col.to_be_bytes());
    }

    async fn add<'q, T>(&mut self, value: T) -> Result<(), BoxError>
    where
        T: sqlx::Encode<'q, Postgres> + sqlx::Type<Postgres>,
    {
        let is_null = value.encode_by_ref(&mut self.encode_buf)?;

        match is_null {
            sqlx::encode::IsNull::Yes => {
                self.data_buf.extend((-1_i32).to_be_bytes());
            }
            sqlx::encode::IsNull::No => {
                self.data_buf
                    .extend((self.encode_buf.len() as i32).to_be_bytes());
                self.data_buf.extend_from_slice(self.encode_buf.as_slice());
            }
        }

        self.encode_buf.clear();

        if self.data_buf.len() > BUFFER_SIZE {
            self.send().await?;
        }

        Ok(())
    }
}

async fn buffered_copy_in<F, C>(generator: impl Iterator<Item = Author>, coverter: C, mut f: F)
where
    C: Fn(Author) -> String,
    F: AsyncFnMut(bytes::Bytes),
{
    let mut buf = bytes::BytesMut::with_capacity(BUFFER_SIZE * 2);
    for author in generator {
        let data = coverter(author);
        buf.extend_from_slice(data.as_bytes());

        if buf.len() >= BUFFER_SIZE {
            let bytes = buf.split().freeze();
            f(bytes).await;
        }
    }
    if !buf.is_empty() {
        let bytes = buf.split().freeze();
        f(bytes).await;
    }
}
```

### バッチ挿入の注意

測定とは関係がないですが、バッチ挿入のコードはデータ数が`chunk_size`で割り切れることを前提にしています。
実際のアプリケーションでは、最後のチャンクを適切に処理する必要があります。

```rust
    let chunk_size = 10000;
    assert!(count % chunk_size == 0);

    let mut query = String::from("INSERT INTO authors (id, name, bio) VALUES ");
    let parameters = (0..chunk_size)
        .map(|i| format!("(${}, ${}, ${})", i * 3 + 1, i * 3 + 2, i * 3 + 3))
        .collect::<Vec<_>>()
        .join(", ");
    query.push_str(&parameters);
```

## 測定結果

100万件のデータ挿入にかかった時間（ミリ秒）：

| 方法                                 | sqlx   | tokio-postgres |
| ------------------------------------ | ------ | -------------- |
| バイナリ形式での`COPY FROM STDIN`    | 636ms  | 627ms          |
| テキスト形式での`COPY FROM STDIN`    | 657ms  | 660ms          |
| CSV形式での`COPY FROM STDIN`         | 720ms  | 702ms          |
| 配列と`UNNEST`を使った一括挿入       | 982ms  | 959ms          |
| プリペアドステートメントを使った挿入 | 1164ms | 1212ms         |

## 感想

事前の予想通り`COPY FROM`を使う方法がもっとも高速でした。大量にデータを挿入する場合は`COPY FROM`を使うのが良さそうです。

個人的に意外だったのは`sqlx`と`tokio-postgres`で大きな速度差がなかった点です。[dieselのメトリクス](https://github.com/diesel-rs/metrics)を過去に見ていたので、もう少し大きな差が生まれると思っていました。
今回のような非常に単純なワークロードではなく、より実践に近い検証を行えば差が出てくるのかもしれません。

## まとめ

今回の検証では、`COPY FROM STDIN`が効率的でした。大量に挿入する場合はまず`COPY FROM STDIN`を検討するのが良さそうです。
しかし、実際のところ挿入する行数やタプル自体のサイズなどの要因によっても変わりうるはずです。
よく言われるように、計測して都度最適な方法を選ぶしかないのだろうと思います。
