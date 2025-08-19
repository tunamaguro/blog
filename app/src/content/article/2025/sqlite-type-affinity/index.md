---
title: "SQLiteの型について"
createdAt: "2025-08-19"
emoji: "🫙"
category: tech
tags:
- SQLite
- SQLx
---

## お断り

初学者が曖昧な理解のままこの文章を記載しています。この文章には間違いがある可能性があるため、公式ドキュメントを確認することを推奨します。参考文献は文末にあります

## はじめに

SQLxでSQLiteを利用する際に型周りで沼にはまった記録です。以下常態で記載


## 沼にはまった事象

以下のコードは単純に`10.0`を挿入してそれを再度取り出しているだけだが、エラーになる

```rust
#[tokio::main]
async fn main() {
    use sqlx::Row as _;
    let pool = sqlx::SqlitePool::connect("sqlite::memory:").await.unwrap();
    sqlx::raw_sql(
        "
    CREATE TABLE test (
        numeric_val NUMERIC
    );
    ",
    )
    .execute(&pool)
    .await
    .unwrap();

    sqlx::query("INSERT INTO test (numeric_val) VALUES (?)")
        .bind(10.0)
        .execute(&pool)
        .await
        .unwrap();

    let row = sqlx::query("SELECT numeric_val FROM test")
        .fetch_one(&pool)
        .await
        .unwrap();

    let val = row.try_get::<f64, _>("numeric_val").unwrap();
    assert_eq!(val, 10.0);
}
```

```bash
$ cargo run
   Compiling type-mapping-sqlx-sqlite v0.1.0 (/workspace/examples/type-mapping/sqlx-sqlite)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 1.10s
     Running `/workspace/target/debug/type-mapping-sqlx-sqlite`

thread 'main' panicked at examples/type-mapping/sqlx-sqlite/src/main.rs:27:52:
called `Result::unwrap()` on an `Err` value: ColumnDecode { index: "\"numeric_val\"", source: "mismatched types; Rust type `f64` (as SQL type `REAL`) is not compatible with SQL type `INTEGER`" }
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

取り出す型を`i64`に変更した次のコードはエラーなく実行できる

```rust
#[tokio::main]
async fn main() {
    use sqlx::Row as _;
    let pool = sqlx::SqlitePool::connect("sqlite::memory:").await.unwrap();
    sqlx::raw_sql(
        "
    CREATE TABLE test (
        numeric_val NUMERIC
    );
    ",
    )
    .execute(&pool)
    .await
    .unwrap();

    sqlx::query("INSERT INTO test (numeric_val) VALUES (?)")
        .bind(10.0)
        .execute(&pool)
        .await
        .unwrap();

    let row = sqlx::query("SELECT numeric_val FROM test")
        .fetch_one(&pool)
        .await
        .unwrap();

    let val = row.try_get::<i64, _>("numeric_val").unwrap();
    assert_eq!(val, 10);
}
```

## SQLiteの型システム

先ほどのエラーの原因はSQLiteの型システムへの不理解による。

SQLiteの型システムは以下の特徴を有している

- データは5種類のストレージクラスのどれかとして保存される
- 列によって型が決定される静的型ではなく、格納される値によって決まる動的型を採用している

### ストレージクラス

SQLiteは以下の5種類のストレージクラスのどれかとして、値が格納される

| 名前    | 説明                                                                                                    |
| ------- | ------------------------------------------------------------------------------------------------------- |
| NULL    | データがないことを示す                                                                                  |
| INTEGER | 符号付整数が格納される。大きさによって0~8バイトになるが、取り出す場合は8バイトになる                    |
| REAL    | IEEE 754 binary64 形式で浮動小数点が格納される                                                          |
| TEXT    | 文字列が格納される。エンコード形式はUTF-8,UTF-16BE,UTF-16LEのいずれか。データベースごとに固定で変更不可 |
| BLOB    | 入力されたデータがそのまま格納される                                                                    |

DATETIMEのような値を保存する専用のストレージクラスはサポートされていない。そのような値は`TEXT`,`REAL`,`INTEGER`の値のどれかとして保存することで、組み込みの日付関数を利用できる

### 型のアフィニティ(親和性)

SQLiteは動的型付けを採用しているため、ある列に複数のストレージクラスの値が格納されうる。以下のコードは`NUMERIC`型を宣言した列に文字列を入れているがこれはエラーにならない

```rust
#[tokio::main]
async fn main() {
    use sqlx::Row as _;
    let pool = sqlx::SqlitePool::connect("sqlite::memory:").await.unwrap();
    sqlx::raw_sql(
        "
    CREATE TABLE test (
        numeric_val NUMERIC
    );
    ",
    )
    .execute(&pool)
    .await
    .unwrap();

    sqlx::query("INSERT INTO test (numeric_val) VALUES (?)")
        .bind("abcde")
        .execute(&pool)
        .await
        .unwrap();

    let row = sqlx::query("SELECT numeric_val FROM test")
        .fetch_one(&pool)
        .await
        .unwrap();

    let val = row.try_get::<String, _>("numeric_val").unwrap();
    assert_eq!(val, "abcde");
}
```

SQLiteの列の型はあくまで格納されるデータ型を推奨するだけで、制約を設けるわけではない。この推奨されるデータ型はアフィニティと呼ばれる。
アフィニティは以下の5種類であり、各列には必ずどれかが割り当てられる

| 名前    | 説明                                                                                                                                                                                                                                                                                |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TEXT    | ストレージクラスNULL,TEXT,BLOBのどれかを使ってデータが格納される。何らかの数値が挿入されたとき、テキスト値に変換されて格納される                                                                                                                                                    |
| NUMERIC | 5つのストレージクラスのうちどれかを使ってデータが格納される。テキスト値が挿入されたとき数値リテラルであればINTEGERもしくはREALストレージクラスで、そうでない場合ストレージクラスTEXTで格納される。正確に整数で表現できるREAL値が挿入されたとき、ストレージクラスINTEGERで格納される |
| INTEGER | NUMERICアフィニティと同じ動作                                                                                                                                                                                                                                                       |
| REAL    | 整数値を自動で浮動小数点に変換することを除いて、NUMERICと同じ動作                                                                                                                                                                                                                   |
| BLOB    | データ値は変換されずにそのまま保存される                                                                                                                                                                                                                                            |

アフィニティは列に割り当てられた型名によって決定される

> FYI: https://www.sqlite.org/datatype3.html#determination_of_column_affinity


## エラーの原因

冒頭で示したコードがエラーになる理由がわかる

<details>
<summary>冒頭のコード（再掲）</summary>

```rust
#[tokio::main]
async fn main() {
    use sqlx::Row as _;
    let pool = sqlx::SqlitePool::connect("sqlite::memory:").await.unwrap();
    sqlx::raw_sql(
        "
    CREATE TABLE test (
        numeric_val NUMERIC
    );
    ",
    )
    .execute(&pool)
    .await
    .unwrap();

    sqlx::query("INSERT INTO test (numeric_val) VALUES (?)")
        .bind(10.0)
        .execute(&pool)
        .await
        .unwrap();

    let row = sqlx::query("SELECT numeric_val FROM test")
        .fetch_one(&pool)
        .await
        .unwrap();

    let val = row.try_get::<f64, _>("numeric_val").unwrap();
    assert_eq!(val, 10.0);
}
```

</details>

データ型NUMERICにはNUMERICアフィニティが割り当てられる。ここで挿入した`10.0`は正確に整数で表現可能なため内部的に`10`として保存されることになる。
結果として、SQLiteからは整数が返却され`f64`では値をデコードできず、エラーになっていた

## 対策

対策として以下の2つが考えられる

### 型指定を`REAL`にする

現在の型名ではNUMERICアフィニティが割り当てられているため、`10.0`などが自動で整数になってしまう。
浮動小数点を保存する列なのであれば、正確に`REAL`型を指定することでREALアフィニティが割り当てられ、変換が行われなくなる

```rust
#[tokio::main]
async fn main() {
    use sqlx::Row as _;
    let pool = sqlx::SqlitePool::connect("sqlite::memory:").await.unwrap();
    sqlx::raw_sql(
        "
    CREATE TABLE test (
        numeric_val REAL
    );
    ",
    )
    .execute(&pool)
    .await
    .unwrap();

    sqlx::query("INSERT INTO test (numeric_val) VALUES (?)")
        .bind(10.0)
        .execute(&pool)
        .await
        .unwrap();

    let row = sqlx::query("SELECT numeric_val FROM test")
        .fetch_one(&pool)
        .await
        .unwrap();

    let val = row.try_get::<f64, _>("numeric_val").unwrap();
    assert_eq!(val, 10.0);
}
```

ただし、この場合でもREAL以外のものが挿入される可能性がある。この場合テーブルに対して`STRICT`オプションを使用することで、REAL以外を挿入することは出来なくなる

<details>
<summary>サンプルコード</summary>

- `STRICT`オプションなし

```rust
#[tokio::main]
async fn main() {
    use sqlx::Row as _;
    let pool = sqlx::SqlitePool::connect("sqlite::memory:").await.unwrap();
    sqlx::raw_sql(
        "
    CREATE TABLE test (
        numeric_val REAL
    );
    ",
    )
    .execute(&pool)
    .await
    .unwrap();

    sqlx::query("INSERT INTO test (numeric_val) VALUES (?)")
        .bind("abcde")
        .execute(&pool)
        .await
        .unwrap();

    let row = sqlx::query("SELECT numeric_val FROM test")
        .fetch_one(&pool)
        .await
        .unwrap();

    let val = row.try_get::<String, _>("numeric_val").unwrap();
    assert_eq!(val, "abcde");
}
```

- `STRICT`オプションあり（挿入時にエラーになる）

```rust
#[tokio::main]
async fn main() {
    use sqlx::Row as _;
    let pool = sqlx::SqlitePool::connect("sqlite::memory:").await.unwrap();
    sqlx::raw_sql(
        "
    CREATE TABLE test (
        numeric_val REAL
    ) STRICT;
    ",
    )
    .execute(&pool)
    .await
    .unwrap();

    sqlx::query("INSERT INTO test (numeric_val) VALUES (?)")
        .bind("abcde")
        .execute(&pool)
        .await
        .unwrap();

    let row = sqlx::query("SELECT numeric_val FROM test")
        .fetch_one(&pool)
        .await
        .unwrap();

    let val = row.try_get::<String, _>("numeric_val").unwrap();
    assert_eq!(val, "abcde");
}
```
```bash
cargo run
   Compiling type-mapping-sqlx-sqlite v0.1.0 (/workspace/examples/type-mapping/sqlx-sqlite)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 1.08s
     Running `/workspace/target/debug/type-mapping-sqlx-sqlite`

thread 'main' panicked at examples/type-mapping/sqlx-sqlite/src/main.rs:20:10:
called `Result::unwrap()` on an `Err` value: Database(SqliteError { code: 3091, message: "cannot store TEXT value in REAL column test.numeric_val" })
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

</details>


### `CAST`式を使う

SQLiteにはストレージクラスを変換する[CAST式](https://www.sqlite.org/lang_expr.html#castexpr)がある。これを利用することでストレージクラスINTEGERで格納されたデータをREALに変換できる。

```rust
#[tokio::main]
async fn main() {
    use sqlx::Row as _;
    let pool = sqlx::SqlitePool::connect("sqlite::memory:").await.unwrap();
    sqlx::raw_sql(
        "
    CREATE TABLE test (
        numeric_val REAL
    );
    ",
    )
    .execute(&pool)
    .await
    .unwrap();

    sqlx::query("INSERT INTO test (numeric_val) VALUES (?)")
        .bind(10.0)
        .execute(&pool)
        .await
        .unwrap();

    let row = sqlx::query("SELECT CAST(numeric_val AS REAL) AS numeric_val FROM test")
        .fetch_one(&pool)
        .await
        .unwrap();

    let val = row.try_get::<f64, _>("numeric_val").unwrap();
    assert_eq!(val, 10.0);
}
```

## 終わりに

雰囲気で使う前によくドキュメントを読めば沼らなかった

## 参考

- https://www.sqlite.org/datatype3.html
- https://sqlite.org/floatingpoint.html
- https://www.sqlite.org/lang_expr.html#castexpr
- https://www.sqlite.org/stricttables.html
