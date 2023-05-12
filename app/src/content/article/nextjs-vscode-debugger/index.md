---
layout: "@/layouts/MdLayout.astro"
title: "Next.jsをVS Codeでデバッグする"
date: "2023-05-13"
emoji: "🐞"
tags: ["tech"]
---

## はじめに

最近`Next.js`を使ってあれこれする機会がありました。そのため、公式ドキュメントを見る機会が多々あり、
その中でデバッグに関する項目があったのでそれをやってみたメモになります。

<https://nextjs.org/docs/pages/building-your-application/configuring/debugging>

## 結論

## 環境構築

詳細は長くなるので割愛しますが、`devcontainer`を使った環境を使用します。該当のコミットは以下のリンクから確認できます。

<https://github.com/tunamaguro/nextjs-vscode-debugger-sample/commit/63eb07d01722cc5113e6d799b9602c317a067321>

各種バージョンは以下のようになっています。

```bash
node -v
v18.16.0

npm -v
9.5.1
```

続いて、`create-next-app`で`Next.js`アプリのひな形を作成します。
今回は`typescript`+`App Router`を選び、その他の項目は適当に設定しています。

```bash
npx create-next-app@latest

✔ What is your project named? … app
✔ Would you like to use TypeScript with this project? …  Yes
✔ Would you like to use ESLint with this project? … Yes
✔ Would you like to use Tailwind CSS with this project? … No
✔ Would you like to use `src/` directory with this project? … Yes
✔ Use App Router (recommended)? … Yes
✔ Would you like to customize the default import alias? … No
Creating a new Next.js app in /workspaces/app.
```

一応動作確認をしておきます。

```bash
cd app && npm run dev
```

![](/images/nextjs-vscode-debugger/npm-run-dev.png)

問題なさそうですね!

## 公式ドキュメント通りにやってみる

何はともあれ公式ドキュメントの通りにやってみます。

<https://nextjs.org/docs/pages/building-your-application/configuring/debugging>

`.vscode/launch.json`に設定をすれば良いようなのでコピペします。

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    },
    {
      "name": "Next.js: debug full stack",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev",
      "serverReadyAction": {
        "pattern": "started server on .+, url: (https?://.+)",
        "uriFormat": "%s",
        "action": "debugWithChrome"
      }
    }
  ]
}
```

`Python`でデバッグするように`Ctrl + Shift + D`でデバッグパネルを開いて`F5`でデバッガーを起動します。今回は`Next.js: debug server-side`を選んで起動させます。

![](/images/nextjs-vscode-debugger/debugger-tab.png)

![](/images/nextjs-vscode-debugger/debugger-not-working.png)

ダメみたいですね...

## 設定を修正する

できないだけで終わるのは悔しいのでもう少し試してみます。  
コンソールの出力を見る限り出力を見る限り、コマンドの実行位置がおかしいのが原因に思えます。
なので、いったん`.vscode/launch.json`を`/app`下に移動させそれで正しく動作するか確認します。

![](/images/nextjs-vscode-debugger/debugger-worked-under-app.png)

正しく起動しているようです。ここでは割愛しますが、サーバ側、クライアント側ともにブレークポイントが正常に起動していることを確認できました。  

ですがこのままだとデバッグをするたびに`/app`に移動する必要があるため非常に手間です。
「何とかできないかな~」とネットの海を彷徨っていたところ、`VS Code`の`workspace`という機能を発見しました。
この機能を利用することで**特定のディレクトリ**でのみ有効なデバッガーを利用することができるようなので早速使ってみます。

> Persist task and debugger launch configurations that are only valid in the context of that workspace.  
> そのワークスペースのコンテキストでのみ有効なタスクとデバッガーの起動設定を永続化します。(Deepl翻訳)

<https://code.visualstudio.com/docs/editor/workspaces>
<https://code.visualstudio.com/docs/editor/multi-root-workspaces#_workspace-launch-configurations>

詳しい説明は上記2つのリンクに書かれているので詳しい情報が知りたい方はそちらをご覧ください。
今回は‘workspaces.code-workspace'という名前で設定ファイルを作成し、以下のように記載しました。

```json
{
 "folders": [
  {
   "name": "workspaces",
   "path": "."
  },
  {
   "name": "frontend",
   "path": "./app"
  }
 ],
 "settings": {},
 "extensions": {},
}
```

上のようなファイルを作成し`File` -> `Open Workspace from File...`から先ほど作成したファイルを選択します。すると

![](/images/nextjs-vscode-debugger/open-workspace.gif)

デバッグパネルから`/app`下の`launch.json`を起動できます!!  

この状態のコミットは[こちら](https://github.com/tunamaguro/nextjs-vscode-debugger-sample/commit/cae5f060ff5cf83c64fee58e353d9623e788bc90)です。  

## Route Handlersのデバッグ

はじめに`Route Handlers`(`pages`で言う`API Routes`)の動作チェックをしてみます。

<https://nextjs.org/docs/app/building-your-application/routing/router-handlers>

上記を参考に`app/api/route.ts`を以下の内容で作成しました。

```typescript
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    console.log("Hello Server!")
    return NextResponse.json({ greet: "Hello!" })
}
```

`http://localhost:3000/api`にブラウザでアクセスすると予想通り`{ greet: "Hello!" }`と表示され、同時にサーバ側では`Hello Server!`が出力されています。

![](/images/nextjs-vscode-debugger/access-api-by-browser.png)

```bash
---略--
Waiting for the debugger to disconnect...
Hello Server!
Waiting for the debugger to disconnect...
```

ここで4行目の`console.log("Hello Server!")`にブレークポイントを設定し、止まればいい感じですが...

![](/images/nextjs-vscode-debugger/debugger-working-at-route.gif)

しっかり止めてくれました!!  

## Server Componentsのデバッグ

続いて`ServerComponents`がデバッグできるかどうか確認します。

`/src/app/page.tsx`を以下のように書き換えます。

```tsx
// import(略)
async function getCreatedAt() {
  const createdAt = new Date()
  return new Promise<Date>((resolve) => {
    setTimeout(() => {
      resolve(createdAt)
    }, 2000)
  })
}

export default async function Home() {
  const createdAt = await getCreatedAt()

  return (
    <main className={styles.main}>
      <div>{createdAt.toISOString()}</div>
// 以下略
```

2秒待つ関数`getCreatedAt`を作成しそれを埋め込んでいます。デフォルトが`ServerComponents`なので`getCreatedAt`はサーバー側で実行されるため、先ほどと同じように止まるはずです。

![](/images/nextjs-vscode-debugger/debugger-server-components.gif)

予想通りしっかり停止し、返されている値も問題なさそうです。

現在の状態のコミットは[こちら](https://github.com/tunamaguro/nextjs-vscode-debugger-sample/commit/2d079fdf7361f6197b93a0364a19fa3ac47f7544)です。

## Client Componentsのデバッグ

最後に`Client Components`もデバッグができるか確かめます。

`src/app/ClientCountUp.tsx`を以下の内容で作成し、`page.tsx`に配置します。

- `src/app/ClientCountUp.tsx`

```tsx
'use client';

import { useState } from 'react';

export function ClientCountUp() {
  const [count, setCount] = useState(0);
  function countUp() {
    console.log("count Up!")
    setCount(count + 1);
  }

  return (
    <button onClick={countUp}>{count}</button>
  );
}
```

- `src/app/page.tsx`

```tsx
// import(略)
import { ClientCountUp } from './ClientCountUp'

// 略

export default async function Home() {
  const createdAt = await getCreatedAt()

  return (
    <main className={styles.main}>
      <ClientCountUp />
// 略
```

こちらは単純にクリックした回数を数えるだけのコンポーネントですが、`Server Components`は`useState`のようなフックを利用できないので`"use client"`宣言をしています。
そのため、これはクライアント側でレンダリングされます。

![](/images/nextjs-vscode-debugger/debugger-client-components.gif)

クライアント側も問題なくデバッグできています。  
現在の状態のコミットは[こちら](https://github.com/tunamaguro/nextjs-vscode-debugger-sample/commit/b2508a5db6d3cd54c94c98b3cedb3550e09a10d3)です。

## おわりに

`VS Code`の`workspace`を利用することで、開いているディレクトリが`Next.js`のルートディレクトリでなくともデバッガーを使用することができました。これでもう`console.log`とおさらばできます。  
今回`workspace`という機能ををはじめて知ったのですが、ドキュメントを読む限りほかにもいろいろなことができそうです。また誰かの役に立ちそうなことがあれば、記事に書きたいと思います。

ここまで駄文をお読みくださりありがとうございました。
