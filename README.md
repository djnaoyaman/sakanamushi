# さかなむし

魚へん・虫へんの難読漢字を学べる無料のクイズ・図鑑サイトです。

🔗 公開URL: https://djnaoyaman.github.io/sakanamushi/

## 機能

- **クイズモード**: 魚へん／虫へん／ミックスから出題範囲を選び、四択クイズに挑戦
- **漢字図鑑モード**: 全漢字と読み方・意味を一覧表示
- 結果をXでシェアできるボタン付き

## SEO / LLMO / SNS対策

- タイトル・meta description・canonical・OGP（Facebook/LINE等）・Twitter Cardを設定
- JSON-LD構造化データ（WebSite / FAQPage）を埋め込み
- クイズ部分だけでなく、常にクロール可能な静的HTMLの漢字一覧（図鑑セクション）を用意
- `robots.txt` / `sitemap.xml` を設置
- `llms.txt`（LLM向けサイト要約ファイル）を設置し、AI検索エンジンからの参照を意識
- OGP用のシェア画像 (`assets/og-image.png`) を同梱

## 技術構成

素のHTML / CSS / JavaScript のみで構成。ビルド不要で GitHub Pages にそのまま公開できます。

```
index.html
css/style.css
js/script.js
assets/og-image.png
assets/favicon.svg
robots.txt
sitemap.xml
llms.txt
```

## ローカルで確認する

```bash
# 任意の静的サーバーで配信するだけでOK
npx serve .
```
