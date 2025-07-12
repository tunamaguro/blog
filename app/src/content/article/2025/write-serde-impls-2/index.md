---
title: "serde周りの実装をする際に詰まったこと"
createdAt: "2025-03-12"
emoji: "🛼"
category: "tech"
tags:
  - Rust
  - serde
---

[前回の終わりに](/articles/20250224-serdeに入門した#終わりに)でやってみたいこととしていたことが実装できたので、それにおける学びのメモです

## `Read`/`Write`への対応

Rustには何かに対して読み込み/書き込みを行う抽象化として、`Read`/`Write`トレイトがあります。作成したクレートは`no_std`環境を主眼においているため`std`に属するこれらは使えませんが、
いい感じのクレートを目指すために対応を行います。実際のところは、テストにおいて`Vec`を使いたいため対応しました。実装したPRは以下です

- `Write`への対応: https://github.com/tunamaguro/messagepack-rs/pull/10
- `Read`への対応: https://github.com/tunamaguro/messagepack-rs/pull/13

`Write`へはうまく対応できましたが、`Read`への対応は、以下のようにいったんすべて読みだすだけに留まっています

```rust
pub fn from_reader<R, T>(reader: &mut R) -> std::io::Result<T>
where
    R: std::io::Read,
    T: for<'a> Deserialize<'a>,
{
    let mut buf = Vec::new();
    reader.read_to_end(&mut buf)?;

    let mut deserializer = Deserializer::from_slice(&buf);
    T::deserialize(&mut deserializer).map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))
}
```

`Read`トレイトの定義の都合上、どうあがいてもメモリ割り当てが必要になり`no_std`で利用できなくなります。そのため、コアの実装を書き直すほどではないと考えこのような実装になっています

```rust
pub trait Read {
    // Required method
    fn read(&mut self, buf: &mut [u8]) -> Result<usize>;
}
```

`Write`のほうは[別クレートの実装を眺めていたところ](https://github.com/enarx/ciborium/tree/main)うまく取り込むことができそうだったため、参考にしながら書き換えました

## データが小さくなるようにシリアライズ

[MessagePackは数値型を示すデータが多数あります](https://github.com/msgpack/msgpack/blob/master/spec.md#int-format-family)。
そのため整数の「1」をMessagePackに変換する場合、`positive fixint`、`uint 8`や`int 32`なども同じ値を表現できますが、なるべく小さくあってほしいと思うのは普通のことだと思います。
というわけで、元の値の意味を失わない程度に小さいデータ型として変換するオプションを追加しました。[実装PRはこれです](https://github.com/tunamaguro/messagepack-rs/pull/14)。
オプションは`Exact`、`LosslessMinimize`、`AggressiveMinimize`の3つを用意しています。

MessagePackからRustの構造体へマッチさせる際は、後述する`Number`を利用すれば良いだろうと考えたので、とくにオプションを用意していません

## `extension`周りの実装

MessagePackには`extension`という好きなバイト列を格納できるデータが存在します。実装としては次のようになるでしょう

```rust
pub struct ExtensionRef<'a> {
    pub kind: i8,
    pub data: &'a [u8],
}

impl ser::Serialize for ExtensionRef<'_> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let encoder = ExtensionEncoder::new(self.kind, self.data);
        let format = encoder
            .to_format::<()>()
            .map_err(|_| ser::Error::custom("Invalid data length"))?;

        let mut seq = serializer.serialize_seq(Some(4))?;

        seq.serialize_element(serde_bytes::Bytes::new(&format.as_slice()))?;

        const EMPTY: &[u8] = &[];

        match format {
            messagepack_core::Format::FixExt1 => {
                seq.serialize_element(serde_bytes::Bytes::new(EMPTY))
            }
            messagepack_core::Format::FixExt2 => {
                seq.serialize_element(serde_bytes::Bytes::new(EMPTY))
            }
            messagepack_core::Format::FixExt4 => {
                seq.serialize_element(serde_bytes::Bytes::new(EMPTY))
            }
            messagepack_core::Format::FixExt8 => {
                seq.serialize_element(serde_bytes::Bytes::new(EMPTY))
            }
            messagepack_core::Format::FixExt16 => {
                seq.serialize_element(serde_bytes::Bytes::new(EMPTY))
            }
            messagepack_core::Format::Ext8 => {
                let len = (self.data.len() as u8).to_be_bytes();
                seq.serialize_element(serde_bytes::Bytes::new(&len))
            }
            messagepack_core::Format::Ext16 => {
                let len = (self.data.len() as u16).to_be_bytes();
                seq.serialize_element(serde_bytes::Bytes::new(&len))
            }
            messagepack_core::Format::Ext32 => {
                let len = (self.data.len() as u32).to_be_bytes();
                seq.serialize_element(serde_bytes::Bytes::new(&len))
            }
            _ => unreachable!(),
        }?;
        seq.serialize_element(serde_bytes::Bytes::new(&self.kind.to_be_bytes()))?;
        seq.serialize_element(serde_bytes::Bytes::new(self.data))?;

        seq.end()
    }
}
```

ですが、現在の`Serializer`はバイト列をフォーマットヘッダーなしで書き込めないため、`seq.serialize_element(serde_bytes::Bytes::new(self.data))?;`などで余計なモノが付いてきます

```rust
(snip)
    fn serialize_bytes(self, v: &[u8]) -> Result<Self::Ok, Self::Error> {
        self.current_length += BinaryEncoder(v).encode(self.writer)?;
        Ok(())
    }
```

対策として、[bsonなどでも使われている](https://github.com/mongodb/bson-rust/blob/main/src/ser/serde.rs#L307-L357)`new_type`を経由し、特定の`Serializer`を利用する方法を使います。
入力された名前に応じて、利用する`Serializer`を切り替えます。実装としては以下のような形です

- `Serializer`側

```rust
    fn serialize_newtype_struct<T>(
        self,
        name: &'static str,
        value: &T,
    ) -> Result<Self::Ok, Self::Error>
    where
        T: ?Sized + ser::Serialize,
    {
        match name {
            EXTENSION_STRUCT_NAME => {
                let mut ser = SerializeExt::new(self.writer, &mut self.current_length);
                value.serialize(&mut ser) // 特定の構造体だけ、別のシリアライザを利用
            }
            _ => value.serialize(self.as_mut()), // 通常の構造体
        }
    }
```

- `Serialize`側

```rust
impl ser::Serialize for ExtInner<'_> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let encoder = ExtensionEncoder::new(self.kind, self.data);
        let format = encoder
            .to_format::<()>()
            .map_err(|_| ser::Error::custom("Invalid data length"))?;

        let mut seq = serializer.serialize_seq(Some(4))?;

        seq.serialize_element(serde_bytes::Bytes::new(&format.as_slice()))?;

        const EMPTY: &[u8] = &[];

        match format {
            messagepack_core::Format::FixExt1 => {
                seq.serialize_element(serde_bytes::Bytes::new(EMPTY))
            }
            messagepack_core::Format::FixExt2 => {
                seq.serialize_element(serde_bytes::Bytes::new(EMPTY))
            }
            messagepack_core::Format::FixExt4 => {
                seq.serialize_element(serde_bytes::Bytes::new(EMPTY))
            }
            messagepack_core::Format::FixExt8 => {
                seq.serialize_element(serde_bytes::Bytes::new(EMPTY))
            }
            messagepack_core::Format::FixExt16 => {
                seq.serialize_element(serde_bytes::Bytes::new(EMPTY))
            }
            messagepack_core::Format::Ext8 => {
                let len = (self.data.len() as u8).to_be_bytes();
                seq.serialize_element(serde_bytes::Bytes::new(&len))
            }
            messagepack_core::Format::Ext16 => {
                let len = (self.data.len() as u16).to_be_bytes();
                seq.serialize_element(serde_bytes::Bytes::new(&len))
            }
            messagepack_core::Format::Ext32 => {
                let len = (self.data.len() as u32).to_be_bytes();
                seq.serialize_element(serde_bytes::Bytes::new(&len))
            }
            _ => unreachable!(),
        }?;
        seq.serialize_element(serde_bytes::Bytes::new(&self.kind.to_be_bytes()))?;
        seq.serialize_element(serde_bytes::Bytes::new(self.data))?;

        seq.end()
    }
}

impl ser::Serialize for ExtensionRef<'_> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_newtype_struct(
            EXTENSION_STRUCT_NAME,
            &ExtInner {
                kind: self.kind,
                data: self.data,
            },
        )
    }
}
```

この方法の欠点は、値のシリアライズを特定の`Serializer`でしか行えなくなる点です。これを`serde_json`等でシリアライズしてもネストされた配列が（おそらく）書き込まれる形になると思います

一番面倒だったのはこれです

## おわりに

ひとまず、当初実装したいと考えていた機能については実装し終えたので満足しています。
普段と違い、今回はテストを多めに書くことを意識して実装を進めました。テストを書くこと自体はそれなりに大変でしたが、大きな書き換えを行う際の安心感が段違いでした。
今後もテストを書く習慣は続けていきたいと思います
