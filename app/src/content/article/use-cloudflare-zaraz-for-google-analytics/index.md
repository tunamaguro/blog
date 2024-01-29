---
draft: false
title: "Google AnalyticsをCloudflare Zarazに移行する"
createdAt: "2024-01-23"
emoji: "☀️"
category: "tech"
tags:
  - Cloudflare
---
<!-- https://requestmap.webperf.tools/render/240122_BiDcC5_FY3  -->
## はじめに

https://zenn.dev/kameoncloud/articles/a44fec324cfb3f

最近上の記事を読みました。このサイトでもアクセス状況収集のためにGoogle Analyticsを利用していますが、同意画面を用意していませんでした。
この実装および実行によるパフォーマンスの低下をCloudflareに委譲できるということで試してみます

## Zaraz有効化

https://developers.cloudflare.com/zaraz/get-started/add-tool/

有効化自体は非常に簡単に行うことができました。Cloudflareコンソールを開き、左のサイドバーから「Zaraz」->「Tools Configuration」へ移動します

![Zaraz console view](src/assets/images/use-cloudflare-zaraz-for-google-analytics/zaraz-console.png)

Google Analytics 4をクリックするとセットアップ画面が表示されるので、「Continue」を押します

![Zaraz GA4セットアップ画面](src/assets/images/use-cloudflare-zaraz-for-google-analytics/zaraz-ga4-setup-view-1.png)

次に与える権限についての画面が出てきます。詳細を確認していないので分かっていないのですが、今回はデフォルトのまま進めたのでそのまま「Continue」を押します

> このあたりの話なのかな~と思ってます(読んでない)  
> https://developers.cloudflare.com/zaraz/advanced/load-custom-managed-component/#configure-a-managed-component-in-cloudflare

![Zaraz GA4権限画面](src/assets/images/use-cloudflare-zaraz-for-google-analytics/zaraz-ga4-setup-view-2.png)

Tool Nameはお好きなものを、Measurement IDには自身のものを入力してください。

![Zaraz GA4測定ID設定画面](src/assets/images/use-cloudflare-zaraz-for-google-analytics/zaraz-ga4-setup-view-3.png)

私は追加の設定としてオリジンのIPアドレスを提出させない設定を追加しました

![Zaraz GA4 IPアドレスを提出しない](src/assets/images/use-cloudflare-zaraz-for-google-analytics/zaraz-ga4-setup-view-4.png)

もろもろの設定が完了したら、「Save」を押します。この時点でページを確認すると、Cloudflareが挿入したと思われるscriptタグが増えていました

![Zarazが挿入したと思われるタグ](src/assets/images/use-cloudflare-zaraz-for-google-analytics/zaraz-ga4-script-tag.png)

> 該当部分のソースコード  
> https://github.com/tunamaguro/blog/blob/cade0169846461b6025ec911a3b4d9865ddbab65/app/src/components/Seo/index.astro#L43-L57