---
title: "AstroでもGatsbyのexcerptがしたい!"
createdAt: "2023-05-17"
emoji: "🔧"
tags: ["tech"]
---

## はじめに

`Gatsby`でブログを構築する場合`gatsby-plugin-mdx`のようなプラグインを利用することが一般的だと思います。
このプラグインには`excerpt`という私がとても便利に思っていたプロパティがあったのですが、`Astro`に乗り換えた際に使えなくなってしまいました。
この記事は`Astro`で`excerpt`っぽいものを再現した記録です。

- `gatsby-plugin-mdx`  
<https://www.gatsbyjs.com/plugins/gatsby-plugin-mdx/#graphql-mdx-node-structure>

## 再現したいこと

`excerpt`プロパティは`mdx`から先頭の何文字かを抜き出します。具体的には下のような文章は

```md
## はじめに

先日以下の記事を読んで真似したくなったので、練習も兼ねて Cloudflare Pages に移行しました。

[日本国内だと Netlify より Cloudflare Pages の方が速い！](https://qiita.com/akitkat/items/dcbe4fcaacc051753e2b)

これで少しでも早くなってると嬉しいです。

## やったこと

作業のほとんどを以下の記事を参考に行いました。ありがとうございます!!

- [Cloudflare Pages で Gatsby を動かすのは案外難しい](https://zenn.dev/appare45/articles/cloudflarepages-gatsby)
- [GitHub Actions でビルドして Cloudflare Pages にデプロイする](https://zenn.dev/nwtgck/articles/1fdee0e84e5808)

そのほかの参考リンクは[このイシュー](https://github.com/tunamaguro/blog/issues/26)にすべて貼ってあります。

```

このように変換されます。

```md
はじめに 先日以下の記事を読んで真似したくなったので、練習も兼ねて Cloudflare Pages に移行しました。 日本国内だと Netlify より Cloudflare Pages の方が速い！ これで少しでも早くなってると嬉しいです。 やったこと 作業のほとんどを以下の…
```

これが可能になると面倒な記事の説明を考える作業を自動で行うようになり、記事を各手間を減らすことができます。
(もちろん自分で考えた説明のほうがSEO上良いとは思いますが面倒なのです)
  
👇`Gatsby`で`excerpt`を使えば自動でdescriptionを設定できる!

```tsx

export const query = graphql`
  query ArticleQuery($id: String) {
    mdx(id: { eq: $id }) {
      frontmatter {
        title
        date(formatString: "yyyy-MM-DD")
        emoji
        tags
        slug
      }
      excerpt(pruneLength: 50)
    }
  }
`;

export const Head: HeadFC = ({ data }) => (
  <Seo
    title={data.mdx.frontmatter.title}
    desription={data.mdx.excerpt}
    pathname={`/articles/${data.mdx.frontmatter.slug}`}
  />
);
```

## 解決策

完全に見逃していたのですが、公式ドキュメントに上の要件を達成する方法が記載されていました。

<https://docs.astro.build/en/guides/markdown-content/#modifying-frontmatter-programmatically>

これによると`remark`あるいは`rehype`のプラグインを書くことで`frontmatter`に好きな値を設定できるようです。
そこで各種の素晴らしい解説を参考に以下のようなプラグインを書きました。

```typescript
import { toString } from "hast-util-to-string";
import { truncate, type Options } from "hast-util-truncate";

/** @type {import('unified').Plugin<[Options]>} */
export function rehypeExcerptContent(
  options: Options = { ellipsis: "…" }
):
  | void
  | import("unified").Transformer<import("hast").Root, import("hast").Root> {
  return function (tree, { data }) {
    const truncatedTree = truncate(tree, { ellipsis: '…', ...options });
    const excerpt = toString(truncatedTree).replaceAll(/\s/g, " ");
    // @ts-ignore See https://docs.astro.build/en/guides/markdown-content/#modifying-frontmatter-programmatically
    data.astro.frontmatter.excerpt = excerpt;
  };
}

```

> 私の理解が低く仕組みがよくわかっていないので、詳しくは公式ドキュメントやその他の解説記事をご覧ください

これを`astro.config.mjs`に設定しますが、今回は`md`でも`mdx`で`excerpt`を使いたかったので`markdown`で読み込みます。詳しくは上記公式ドキュメントを参照してください。

```javascript

import { rehypeExcerptContent } from "/path/to/plugin/rehypeExcerptPlugin";

// 略

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex, rehypeExcerptContent],  //👈ここ
  },
```

このようにすることで、`frontmatter.excerpt`に記事の先頭140文字が設定されます。

## 実際に使ってみる

私は記事に`Content Collections`を利用しているため`Aatro.props`から`frontmatter`の値を読み取ることはできませんが、`render`の返り値の中の`remarkPluginFrontmatter`からその値を読み取ること可能です。確認していませんが、`pages`以下の場合は`Astro.props`で読み取れると思います。

<https://docs.astro.build/en/guides/content-collections/#modifying-frontmatter-with-remark>

```tsx
const { Content, remarkPluginFrontmatter } = await article.render();
```

公式ドキュメントにも書いてありますが、この値は型安全ではないので下のように適当なスキーマを書いて型安全にしてから使います。

```astro
---
// 略
const frontmatterSchema = z.object({
  excerpt: z.string(),
});

const { Content, remarkPluginFrontmatter } = await article.render();
const frontmatter = frontmatterSchema.parse(remarkPluginFrontmatter);

const contentDescription = maybeDescription ?? frontmatter.excerpt;

---
<BaseLayout
  title={title}
  description={contentDescription}
// 略
```

確認してみると確かに設定されています。

![](/images/astro-markdown-content-excerpt/meta.png)

## おわりに

`Gatsby`っぽい機能を再現するだけの記事を最後まで読んでくださりありがとうございました。少しでも誰かの助けになれば幸いです。


## 余談

実はこの設定をする前はより泥臭い方法で文章の抜粋を作成していましたが、さすがに恥ずかしいのでリンクを貼るだけにさせてください。

https://github.com/tunamaguro/blog/commit/e0f8630791e531571c8f2d9312b6be089ccad5c3  
https://github.com/tunamaguro/blog/commit/e843bc7b043dc08c79cc936fe7fe1fe1de53d366