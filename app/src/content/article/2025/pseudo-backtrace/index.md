---
title: "疑似バックトレースを作成するライブラリを実装した"
createdAt: "2025-10-01"
emoji: "🌃"
category: "tech"
tags:
  - Rust
---

## はじめに

[proc-macro-workshop](https://github.com/dtolnay/proc-macro-workshop)をある程度進めており、勉強のため[GreptimeDBで紹介されていた疑似バックトレース](https://greptime.com/blogs/2024-05-07-error-rust)を実現するライブラリを実装しました。

## できたもの

https://github.com/tunamaguro/pseudo-backtrace

READMEそのままですが、`to_chain`を呼び出すとバックトレース表示用の構造体を得られます。

```rust
use pseudo_backtrace::{StackError, StackErrorExt};

#[derive(Debug)]
pub struct ErrorA(());

impl core::fmt::Display for ErrorA {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        "ErrorA".fmt(f)
    }
}

impl core::error::Error for ErrorA {}

#[derive(Debug, StackError)]
pub struct ErrorB {
    #[stack_error(std)]
    source: ErrorA,
    location: &'static core::panic::Location<'static>,
}

impl core::fmt::Display for ErrorB {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        "ErrorB".fmt(f)
    }
}

impl core::error::Error for ErrorB {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        Some(&self.source)
    }
}

impl From<ErrorA> for ErrorB {
    #[track_caller]
    fn from(value: ErrorA) -> Self {
        ErrorB {
            source: value,
            location: core::panic::Location::caller(),
        }
    }
}

#[derive(Debug, StackError)]
pub struct ErrorC {
    source: ErrorB,
    location: &'static core::panic::Location<'static>,
}

impl core::fmt::Display for ErrorC {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        "ErrorC".fmt(f)
    }
}

impl core::error::Error for ErrorC {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        Some(&self.source)
    }
}

impl From<ErrorB> for ErrorC {
    #[track_caller]
    fn from(value: ErrorB) -> Self {
        ErrorC {
            source: value,
            location: core::panic::Location::caller(),
        }
    }
}


fn main() {
    let a = ErrorA(());
    let b = ErrorB::from(a);
    let c = ErrorC::from(b);

    println!("{}", c.to_chain())
    // will be printed to standard output as follows:
    // 0: ErrorC, at examples/simple.rs:74:13
    // 1: ErrorB, at examples/simple.rs:73:13
    // 2: ErrorA
}
```

## `StackError`マクロについて

[`StackError`トレイト](https://docs.rs/pseudo-backtrace/latest/pseudo_backtrace/trait.StackError.html)は定義の通り、とてもシンプルなので手続きマクロの方について書きます。
このマクロが行っていることはタプルあるいは構造体をパースして、`StackError`を実装しています。`thiserror`のように`Error`を実装したり、`#[location]`対応の`From`を実装したりはしていません。
そのあたりは別のクレートで行ってもらうことを前提にすることで、マクロ自体は思ったより楽に実装できました。

`From`を実装しないため毎回`Location`用のコードを書かなければならず、これが非常に手間なためどこかで対応をしたいです。
（`thiserror`をフォークするか[このPR](https://github.com/dtolnay/thiserror/pull/291)を使うのが現状一番早そうかなと思っています）

## 感想

手続きマクロの勉強にはちょうどいい難易度のものだったかなと思っています。
自分でも使ってみて使い心地を確かめつつ改良していくつもりです。
