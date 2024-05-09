---
title: "ゴールデンウイークの振り返り(2024)"
createdAt: "2024-05-09"
emoji: "🪙"
category: blog
---

ゴールデンウイークからそろそろ1週間がたちますが、今更ながらに今年のゴールデンウイークの振り返りをします。

## Misskeyのメディアプロキシを作った

Rustの学習としてMisskeyのメディアプロキシを作りました

https://github.com/tunamaguro/misskey-webp-proxy

現在自分のMisskeyではこれをメディアプロキシとして使っています。本家の動作と同じように画像をwebpに圧縮して返すだけのシンプルな仕組みですが、
Rustに不慣れなのもあって時間がかかってしまいました。

リリース部分をGitHub Actionsを使って、バイナリの作成とDockerイメージのプッシュがタグをつけたコミットをするたびに行うようになっています。
RustでCI/CDを使うのははじめてでしたがかなり便利だったので次回リポジトリを作る際は、pushするたびに`cargo fmt`や`cargo clippy`が自動で動くようにしたいです

それ以外の感想としてはRustのトレイトの仕組みがかなり便利でした。利用している`libwebp`がCで書かれているので下のように確保したメモリを都度開放する関数を呼び出す必要がありました
```rust
/ Setup the input data
WebPPicture pic;
if (!WebPPictureInit(&pic)) {
  return 0;  // version error
}
pic.width = width;
pic.height = height;
// allocated picture of dimension width x height
if (!WebPPictureAlloc(&pic)) {
  return 0;   // memory error
}
// at this point, 'pic' has been initialized as a container,
// and can receive the Y/U/V samples.
// Alternatively, one could use ready-made import functions like
// WebPPictureImportRGB(), which will take care of memory allocation.
// In any case, past this point, one will have to call
// WebPPictureFree(&pic) to reclaim memory.

// Set up a byte-output write method. WebPMemoryWriter, for instance.
WebPMemoryWriter wrt;
WebPMemoryWriterInit(&wrt);     // initialize 'wrt'

pic.writer = MyFileWriter;
pic.custom_ptr = my_opaque_structure_to_make_MyFileWriter_work;

// Compress!
int ok = WebPEncode(&config, &pic);   // ok = 0 => error occurred!
WebPPictureFree(&pic);  // must be called independently of the 'ok' result.

WebPMemoryWriterClear(&wrt);
```

> https://github.com/webmproject/libwebp/blob/main/doc/api.md より引用

ここで`Drop`トレイトを利用することでメモリ解放をRustの仕組みによって行うことができました

```rust
struct ManagedWebpPicture {
    config: WebPConfig,
    picture: WebPPicture,
}

// snip

impl Drop for ManagedWebpPicture {
    fn drop(&mut self) {
        unsafe { WebPPictureFree(&mut self.picture) }
    }
}
```

> https://github.com/tunamaguro/misskey-webp-proxy/blob/0832163587d2d07a6842b24a1837c75ebf050496/src/webp.rs#L31-L99

これらの仕組みを使っていない開発時にはメモリ周りのエラーで苦しめられたので、これらの仕組みを十分利用していきたいと思います

## Tarkovに復帰した

今季始まってすぐにスカブにアーマーを抜かれて死んでから、しばらく触れていなかったのですが4か月ぶりに復帰しました

![Tarkovプロフィール](src/assets/images/gw-working-2024/tarkov-profile.png)

地獄のSetupを乗り越えたので、これからはあまり根を詰めずゆっくりやっていきたいです

## その他

前から気になっていた本を2冊買いました

- [Goならわかるシステムプログラミング 第2版](https://www.lambdanote.com/products/go-2)
- [プロフェッショナルTLS＆PKI 改題第2版](https://www.lambdanote.com/products/tls-pki-2)

時間を見つけて6月までには読了したいと思います

## 終わりに

次の長期連休は気になっているTCP/IPの自作をやってみたい...

https://drive.google.com/drive/folders/1k2vymbC3vUk5CTJbay4LLEdZ9HemIpZe