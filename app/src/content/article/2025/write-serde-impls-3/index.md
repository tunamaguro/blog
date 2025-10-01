---
title: "messagepack-serdeを書いた感想"
createdAt: "2025-09-30"
emoji: "📖"
category: "tech"
tags:
  - Rust
  - serde
---

以前学習目的で書いたライブラリの[messagepack-serde](https://crates.io/crates/messagepack-serde)をぼちぼちいじっており、おおよそ使える形になってきたと思うので、学びを書いていきます

## 作ってたもの

- リンク: https://crates.io/crates/messagepack-serde

`no_std`で使える`serde`に対応したMessagePackのシリアライザ/デシリアライザです。以下のようにシンプルに使えます

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, PartialEq)]
struct Data<'a> {
    compact: bool,
    schema: u8,
    less: &'a str,
}

let buf: &[u8] = &[
    0x83, 0xa7, 0x63, 0x6f, 0x6d, 0x70, 0x61, 0x63, 0x74, 0xc3, 0xa6, 0x73, 0x63, 0x68,
    0x65, 0x6d, 0x61, 0x00, 0xa4, 0x6c, 0x65, 0x73, 0x73, 0xa9, 0x74, 0x68, 0x61, 0x6e,
    0x20, 0x6a, 0x73, 0x6f, 0x6e,
];

let data = messagepack_serde::from_slice::<Data<'_>>(buf).unwrap();
let expected = Data {
    compact: true,
    schema: 0,
    less: "than json",
};
assert_eq!(data, expected);

let mut serialized = [0u8; 33];
let len = messagepack_serde::to_slice(&expected, &mut serialized).unwrap();
assert_eq!(&serialized[..len], buf);
```

> Ref: https://github.com/tunamaguro/messagepack-rs/blob/c2d0ec40c81a744b3341db076287fe003800a0d9/messagepack-serde/README.md

既存の[rmp-serde](https://crates.io/crates/rmp-serde)との違いは主に以下の点です

- `no_std`かつ`alloc`不要で動作する
- 構造体をMessagePackの`map family`としてエンコードする
  - `rmp-serde`はデフォルトで`array family`としてエンコードする（設定で変更可能）
- `ext family`を全面的にサポート。とくに[timestamp](https://github.com/msgpack/msgpack/blob/master/spec.md#timestamp-extension-type)をすべてサポート
  - 例:

基本的によく使われている`rmp-serde`を使う方が良いと思います。作ったものの紹介はこれくらいにして、本題に入ります

## CIで`feature`のチェックをするのは大事

`crates.io`に公開する際にようやく気付いたのですが、`feature`の設定をミスしており特定のフィーチャではそもそもコンパイルできないプログラムになっていました。具体的には[Serializer::collect_str](https://docs.rs/serde/1.0.221/serde/trait.Serializer.html#method.collect_str)は`serde`の`alloc/std`フィーチャがどちらも有効でない場合自分で実装する必要がありますが、開発時は常に`alloc/std`を指定していたため動かないことに気づかないままでした。

今のところ[cargo-hack](https://github.com/taiki-e/cargo-hack)を使ってすべてのフィーチャを総当たりで検証するCIを入れて、また同じ現象が起こるのを防いでいます。

```yaml
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout PR branch
        uses: actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8 # v5.0.0
      - name: Install Rust
        uses: moonrepo/setup-rust@ede6de059f8046a5e236c94046823e2af11ca670 # v1.2.2
        with:
          components: clippy
          cache-base: main
          bins: cargo-hack
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - name: Run lint
        run: |
          cargo hack --each-feature --no-dev-deps clippy -- -D warnings
```

コンパイル時にコードをごにょごにょできる分、そもそもビルドできるかどうかを自動で保証することが重要だと感じています。

> この点は手続きマクロに対して[try-build](https://crates.io/crates/trybuild)で正しくビルドできるか、あるいはエラーになるか検証しようというのと同じかもしれません

## 速度改善の前に計測が大事

実装を進めるにあたりCodSpeedを使ったパフォーマンスベンチマーク用のCIを用意していました。実装を進めるにあたりこれと`codecov`が役に立つことが多かったです

## おわりに

おおよそ必要な機能はすべて実装し終えたと思うので、これ以上いじることはないと思います。
`feature`のミスは本当に気づいていなかったので、`feature`で挙動を切り替えるときはそれをチェックするテストを追加するようにこれからはしていきたいです
