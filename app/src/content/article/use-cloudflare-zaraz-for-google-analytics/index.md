---
title: "Google AnalyticsをCloudflare Zarazに移行する"
createdAt: "2024-01-23"
emoji: "☀️"
category: "tech"
tags:
  - Cloudflare
---

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

大体正しく動作していそうなことが分かったので、もともと設定していたスクリプトタグを削除します

```diff
-<!-- Google tag (gtag.js) -->
-<script
-  async
-  src="https://www.googletagmanager.com/gtag/js?id=G-SDE96EMGMW"
-></script>
-<script>
-  window.dataLayer = window.dataLayer || [];
-  function gtag() {
-    dataLayer.push(arguments);
-  }
-  gtag("js", new Date());
-
-  gtag("config", "G-SDE96EMGMW");
-</script>
```

> https://github.com/tunamaguro/blog/pull/70/commits/18ea75e76f19fa5e4998e3251abd242116bc9561

最終的には次のようなスクリプトが挿入されていました

```html
<script
  defer=""
  referrerpolicy="origin"
  src="/cdn-cgi/zaraz/s.js?z=JTdCJTIyZXhlY3V0ZWQlMjIlM0ElNUIlNUQlMkMlMjJ0JTIyJTNBJTIydHVuYW1hZ3VybydzJTIwYmxvZyUyMiUyQyUyMnglMjIlM0EwLjM3OTQ1ODIxMTUyNDc0NzM1JTJDJTIydyUyMiUzQTI1NjAlMkMlMjJoJTIyJTNBMTQ0MCUyQyUyMmolMjIlM0ExMjcxJTJDJTIyZSUyMiUzQTI1NjAlMkMlMjJsJTIyJTNBJTIyaHR0cHMlM0ElMkYlMkZ3d3cudHVuYW1hZ3Vyby5kZXYlMkYlMjIlMkMlMjJyJTIyJTNBJTIyJTIyJTJDJTIyayUyMiUzQTI0JTJDJTIybiUyMiUzQSUyMlVURi04JTIyJTJDJTIybyUyMiUzQS01NDAlMkMlMjJxJTIyJTNBJTVCJTVEJTdE"
></script>
<script nonce="9a2b9d9a-6393-489d-81c9-2bcd95c416ba">
  try {
    (function (w, d) {
      !(function (b$, ca, cb, cc) {
        b$[cb] = b$[cb] || {};
        b$[cb].executed = [];
        b$.zaraz = { deferred: [], listeners: [] };
        b$.zaraz.q = [];
        b$.zaraz._f = function (cd) {
          return async function () {
            var ce = Array.prototype.slice.call(arguments);
            b$.zaraz.q.push({ m: cd, a: ce });
          };
        };
        for (const cf of ["track", "set", "debug"])
          b$.zaraz[cf] = b$.zaraz._f(cf);
        b$.zaraz.init = () => {
          var cg = ca.getElementsByTagName(cc)[0],
            ch = ca.createElement(cc),
            ci = ca.getElementsByTagName("title")[0];
          ci && (b$[cb].t = ca.getElementsByTagName("title")[0].text);
          b$[cb].x = Math.random();
          b$[cb].w = b$.screen.width;
          b$[cb].h = b$.screen.height;
          b$[cb].j = b$.innerHeight;
          b$[cb].e = b$.innerWidth;
          b$[cb].l = b$.location.href;
          b$[cb].r = ca.referrer;
          b$[cb].k = b$.screen.colorDepth;
          b$[cb].n = ca.characterSet;
          b$[cb].o = new Date().getTimezoneOffset();
          if (b$.dataLayer)
            for (const cm of Object.entries(
              Object.entries(dataLayer).reduce(
                (cn, co) => ({ ...cn[1], ...co[1] }),
                {},
              ),
            ))
              zaraz.set(cm[0], cm[1], { scope: "page" });
          b$[cb].q = [];
          for (; b$.zaraz.q.length; ) {
            const cp = b$.zaraz.q.shift();
            b$[cb].q.push(cp);
          }
          ch.defer = !0;
          for (const cq of [localStorage, sessionStorage])
            Object.keys(cq || {})
              .filter((cs) => cs.startsWith("_zaraz_"))
              .forEach((cr) => {
                try {
                  b$[cb]["z_" + cr.slice(7)] = JSON.parse(cq.getItem(cr));
                } catch {
                  b$[cb]["z_" + cr.slice(7)] = cq.getItem(cr);
                }
              });
          ch.referrerPolicy = "origin";
          ch.src =
            "/cdn-cgi/zaraz/s.js?z=" +
            btoa(encodeURIComponent(JSON.stringify(b$[cb])));
          cg.parentNode.insertBefore(ch, cg);
        };
        ["complete", "interactive"].includes(ca.readyState)
          ? zaraz.init()
          : b$.addEventListener("DOMContentLoaded", zaraz.init);
      })(w, d, "zarazData", "script");
    })(window, document);
  } catch (err) {
    console.error("Failed to run Cloudflare Zaraz: ", err);
    fetch("/cdn-cgi/zaraz/t", {
      credentials: "include",
      keepalive: true,
      method: "GET",
    });
  }
</script>
```

この状態でアクセスしてみたところ次のようにCloudflareからもGoogle Analyticsからも問題なくアクセスを認識できているようです

![Cloudflareでの記録](src/assets/images/use-cloudflare-zaraz-for-google-analytics/cloudflare-ga4-log.png)

![Google Analyticsでの記録](src/assets/images/use-cloudflare-zaraz-for-google-analytics/ga4-analytics-example.png)

また、Google Analyticsのスクリプトを読み込まなくなっており若干ですがパフォーマンスの向上が期待できます

- Zaraz前
  ![Zaraz導入前](src/assets/images/use-cloudflare-zaraz-for-google-analytics/request-map-before-zaraz.png)
- Zaraz後
  ![Zaraz導入後](src/assets/images/use-cloudflare-zaraz-for-google-analytics/request-map-after-zaraz.png)

## 終わりに

この後追加で同意画面を加える作業をしましたが、はじめに貼ったリンクの通り作業をしただけなので割愛します
