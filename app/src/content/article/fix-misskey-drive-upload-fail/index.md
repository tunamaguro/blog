---
title: "Misskeyでドライブへのアップロードがエラーになる問題を修正する"
createdAt: "2024-03-31"
emoji: "💾"
category: tech
tags:
  - misskey
---

個人用Misskeyでドライブにファイルをアップロードした際に次のようなエラーが起きるようになりました。これを調査・エラーが起こらないように対策した記録です

![アップロード失敗](src/assets/images/fix-misskey-drive-upload-fail/upload-fail.png)

## この記事が想定する読者

- Misskeyインスタンスを運用している
- PostgreSQLのレプリケーションを行っており、MisskeyがReadリクエストをレプリカの側に送るように設定している
  - https://github.com/misskey-dev/misskey/blob/develop/.config/example.yml#L115-L130
  - 上記の部分
- ドライブへのアップロード時に上のようなエラーが起きるようになった

## 解決策

postgresqlのレプリケーションを非同期から同期で行われるように変更する

## 概要

[ここで](/articles/personal-misskey-server-on-home-kubernetes)書いたような設定でMisskeyをしばらく運用していました。ある時MisskeyのDBでレプリケーションを有効にした後、次のようなエラーが起きるようになりました

![アップロード失敗](src/assets/images/fix-misskey-drive-upload-fail/upload-fail.png)

このようにアップロード失敗と表示されていますが、実際には正しくアップロードされており、ページを更新することで表示されるようになります

![ドライブには表示される](src/assets/images/fix-misskey-drive-upload-fail/uploaded-file.png)

## 原因

misskeyやredisの再起動などを試しましたが、解決しなかったため2週間ほど放置していました。

![アップロード時にエラーになることに気づく](src/assets/images/fix-misskey-drive-upload-fail/note-1.png)

先日やる気が出たのでログを調査したところ次のようなエラーが出ていました

```txt
ERR  1	[drive register]	EntityNotFoundError: Could not find any entity of type "MiDriveFile" matching: {...
```

またソースコードを確認したところ前述のエラーコードはハンドリングされなかった際に起こるエラーであるようでした（そこまでしっかり見てないので違うかもしれません）

```typescript title="error.ts"
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

type E = {
  message: string;
  code: string;
  id: string;
  kind?: "client" | "server" | "permission";
  httpStatusCode?: number;
};

export class ApiError extends Error {
  public message: string;
  public code: string;
  public id: string;
  public kind: string;
  public httpStatusCode?: number;
  public info?: any;

  constructor(err?: E | null | undefined, info?: any | null | undefined) {
    if (err == null)
      err = {
        message:
          "Internal error occurred. Please contact us if the error persists.",
        code: "INTERNAL_ERROR",
        id: "5d37dbcb-891e-41ca-a3d6-e690c97775ac",
        kind: "server",
        httpStatusCode: 500,
      };

    super(err.message);
    this.message = err.message;
    this.code = err.code;
    this.id = err.id;
    this.kind = err.kind ?? "client";
    this.httpStatusCode = err.httpStatusCode;
    this.info = info;
  }
}
```

https://github.com/misskey-dev/misskey/blob/d4ca973e3408a7d28788efe57bcd882c0ce9eedc/packages/backend/src/server/api/error.ts#L8

また`EntityNotFoundError`はTypeORMに関連したエラーであるため、DBに想定されていたレコードがないことが原因だということもわかりました

ここまでで以下のような仮説を考えました

1. ドライブにアップロードすると、ハッシュ値か何かを含んだレコードがDBに作成される。またジョブキューにも追加される
2. ジョブキューの中身を見て、**Read読み込み**がレプリカDBに行く
3. レプリケーションがまだ終わっていない場合、当然そのレコードは存在しない
4. TypeORMが`EntityNotFoundError`を発生させ、どこにもハンドリングされないまま`ApiError`が送出される
5. 完了しなかったジョブキューが再度実行される。このタイミングではレプリケーションが完了し正常に動作する
6. ドライブにファイルがアップロードされる

## 対策実行

まず仮説が正しいかどうか検証を行いました。上記の仮説のポイントはReadとWriteを行っているDBにおいてレプリケーションが行われていることです。そこでMisskeyでレプリケーションを無効にしてから、上記の現象が発生するか確かめたところエラーは起きないようになりました

```diff title="default.yml"
- dbReplications: true
+ dbReplications: false
```

ある程度正しそうなことが分かったので、レプリケーションを有効にしながらできる対策を考えます。問題はDBのプライマリにWriteされたことがレプリカ側にすぐ反映されていないことなので、レプリケーションの設定を非同期から同期に変更しました。今回の環境ではcloudnative-pgを使って構成していたので設定変更は非常に簡単で、次の設定をマニフェストに加えるだけでした

```diff title="postgres.yaml"
+ minSyncReplicas: 1
+ maxSyncReplicas: 1
```

https://cloudnative-pg.io/documentation/1.22/replication/#synchronous-replication

この状態で再度Misskeyの設定を有効に変更するとエラーが起きずにアップロードできることを確認できました

## 終わりに

実はレプリケーションを有効にしたタイミングでMisskeyのバージョンを上げる作業も行っていたので、当初はこのバージョンアップが原因だと思い、むだな時間を使ってしまいました。
蓋を開けてみれば簡単でしたね...

![完全に理解した](src/assets/images/fix-misskey-drive-upload-fail/note-2.png)
