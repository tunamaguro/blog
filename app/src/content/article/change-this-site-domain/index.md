---
title: "Google DomainsでNetlifyにサブドメインを設定する"
date: "2023-01-27"
emoji: "😅"
tags: ["blog"]
---

## はじめに

このブログにサブドメインを生やそうとしていたら、サイトにアクセスできなくなってしまったのでそれを解決するために試行錯誤した記録を残します。
同じように Netlify にカスタムドメインやサブドメインを設定しようとしている方の助けになれば幸いです。なお当記事は以下の資料によっています。

- [Domains & HTTPS](https://docs.netlify.com/domains-https/custom-domains/configure-external-dns/)

## Netlify の設定

「Site settings」から「Domain Management」を開きます。「Site overview」の「Domain Settings」から直接開いても問題ありません。

![Domainの設定画面](/images/change-this-site-domain/step-1-1.png)

「Add custom domain」を押して登録したいドメイン、またはサブドメインを入力し「Verify」、「Add domain」の順に押していきます。

いい感じにできていれば下のような画面になっているはずです。

![追加後の画面](/images/change-this-site-domain/step-1-2.png)

## 外部 DNS の設定

お使いの DNS プロバイダで CNAME を設定します。私が使用しているのは Google Domains なので表示等が異なる方がいらっしゃると思いますが、
いい感じに読み替えてください。

「DNS」から「カスタムレコードを管理」を押します。その後以下の作業を実施してください。

1. 「ホスト名」に先程**Netlify**に設定したドメインを入力
1. 「タイプ」を「CNAME」に変更
1. 「データ」に Netlify サイトのドメイン(xxxx.netlify.app)を入力

これが完了すると以下のようになっているはずです。

![Google Domainsの設定](/images/change-this-site-domain/step-2-1.png)

ここで Netlify に戻り「Check DNS Configuration」の表示がなくなっていれば完了です。

![設定後の画面](/images/change-this-site-domain/step-2-2.png)

もし「www.yourdomain.com」を設定しようとされている場合は、「Options」から「Set as primary domain」を選択し
プライマリドメインを切り替えると直ると思います(未検証)。

その他のサブドメインを設定したい場合は上の手順を真似て行えばいけると思います。
例えば下は「www」「blog」2 つのサブドメインを設定した例です。

![サブドメイン追加設定後](/images/change-this-site-domain/step-2-3.png)

サブドメインを設定したあとに「証明書が~」のような問題が発生する場合はブラウザのキャッシュを削除するか、時間をおいて(24 時間)再度アクセスするとうまくいくかもしれません。
私はキャッシュをすることによってアクセスできるようになりました。

## オプション:ロードバランサの設定

この設定はサブドメインで上の設定した方は関係ありません。Apex ドメインで設定している方向けです。
Apex ドメインは`xxxx.com`のように独自ドメインの左側にホスト名がつかないドメインです。

なお以下のサイトを参考にしています。メリット・デメリットが記載されているので作業前に 1 度確認されると良いと思います。ガバ要約すると 「Apex ドメインで登録すると CDN のパフォーマンスが悪くなることがあるよ~」という内容です。

[How to Set Up Netlify DNS - Custom Domains, CNAME, & A Records](https://www.netlify.com/blog/2020/03/26/how-to-set-up-netlify-dns-custom-domains-cname-and-a-records/)

やることは簡単で A レコードに Netlify のロードバランサを設定するだけです。記事作成時点では`75.2.60.5`を設定します。
変更されている可能性がありますので、その時々で正しい IP アドレスを確認してください。

![ロードバランサの設定](/images/change-this-site-domain/step-3-1.png)

## SSL 証明書の発行

上の設定がすべて完了していれば Let's Encrypt の SSL 証明書を発行できるようになっているはずなので、
Netlfy のドメイン設定ページの下側にある「HTTPS」を見て設定できているかどうか確認してください。

「Verify DNS configuration」が表示されている場合はクリックすることで発行できるはずです(未検証)。

以上でドメインの設定は完了です。お疲れ様でした。

## 終わりに

サブドメインを設定しようとしてごちゃごちゃしていたらアクセスできなくなったので、すべてを破壊して 1 からやり直すはめになりました 😅。
ただ、こうして記事を書くネタにできたので結果オーライだと思っておくことにしてます。

改めて見ると内容ペラペラな記事ですが、誰かの助けになれば幸いです。
