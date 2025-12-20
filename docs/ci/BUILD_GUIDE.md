# ビルドガイド

このドキュメントでは、Typeflowプロジェクトのビルド方法とトラブルシューティングについて説明します。

## 目次

- [前提条件](#前提条件)
- [基本的なビルド手順](#基本的なビルド手順)
- [トラブルシューティング](#トラブルシューティング)
- [ビルド設定](#ビルド設定)
- [よくある問題と解決方法](#よくある問題と解決方法)

## 前提条件

以下のツールがインストールされている必要があります：

| ツール  | 推奨バージョン | 確認コマンド     |
| ------- | -------------- | ---------------- |
| Node.js | v20.x 以上     | `node --version` |
| Bun     | v1.2.x 以上    | `bun --version`  |

## 基本的なビルド手順

### 1. 依存関係のインストール

```bash
bun install
```

### 2. ビルドの実行

```bash
bun run build
```

成功すると以下のような出力が表示されます：

```
$ vite build
vite v7.x.x building client environment for production...
✓ xxxx modules transformed.
dist/index.html                     0.67 kB │ gzip:   0.39 kB
dist/assets/index-xxxxx.css       xxx.xx kB │ gzip:  xx.xx kB
dist/assets/index-xxxxx.js      x,xxx.xx kB │ gzip: xxx.xx kB
✓ built in x.xxs
```

### 3. ビルド成果物の確認

ビルドが成功すると、`dist/` ディレクトリに以下のファイルが生成されます：

```
dist/
├── index.html
└── assets/
    ├── index-xxxxx.css
    └── index-xxxxx.js
```

## トラブルシューティング

### ビルドが進行しない・ハングする場合

**症状**: `bun run build` を実行しても `vite build` の表示から進まない

**原因**: `node_modules` のキャッシュまたは依存関係が破損している可能性があります

**解決方法**:

```bash
# 1. node_modules と lockファイルを削除
rm -rf node_modules bun.lock

# 2. 依存関係を再インストール
bun install

# 3. ビルドを再実行
bun run build
```

### デバッグモードでのビルド

問題の詳細を確認するには、デバッグモードでビルドを実行します：

```bash
# 方法1: DEBUG環境変数を使用
DEBUG=vite:* bun run build

# 方法2: Viteのログレベルを上げる
npx vite build --logLevel=info

# 方法3: 直接nodeで実行（より詳細なエラー情報）
node --trace-warnings ./node_modules/vite/bin/vite.js build
```

### タイムアウトを設定してビルド

macOSでは `gtimeout` を使用します（要：`brew install coreutils`）：

```bash
# 120秒のタイムアウトでビルド
gtimeout 120 bun run build
```

または、シェルスクリプトでタイムアウトを実装：

```bash
bun run build &
BUILD_PID=$!
sleep 120
if kill -0 $BUILD_PID 2>/dev/null; then
  kill $BUILD_PID
  echo "ビルドがタイムアウトしました"
fi
```

## ビルド設定

### vite.config.ts の主要設定

```typescript
export default defineConfig({
  base: '/', // ベースパス（Cloudflare Pagesでは '/'）
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': `${__dirname}/src`, // @/ エイリアスの設定
    },
  },
  build: {
    minify: 'esbuild', // 高速なminification
    sourcemap: false, // 本番環境ではsourcemapを無効化
  },
})
```

### 環境別の設定

| 環境             | base設定     | 備考                       |
| ---------------- | ------------ | -------------------------- |
| Cloudflare Pages | `/`          | デフォルト                 |
| GitHub Pages     | `/typeflow/` | リポジトリ名をパスに含める |

## よくある問題と解決方法

### 1. エイリアス解決エラー

**エラー**: `Failed to resolve import "@/components/..."`

**原因**: `vite.config.ts` でエイリアスが正しく設定されていない

**解決方法**: `resolve.alias` セクションを確認

```typescript
resolve: {
  alias: {
    '@': `${__dirname}/src`,
  },
},
```

### 2. CSSの警告

**警告**: `Unexpected token ParenthesisBlock`

**原因**: Tailwind CSSの一部の構文がCSS最適化時に警告を出す

**影響**: ビルド自体には影響なし。警告は無視可能

### 3. チャンクサイズ警告

**警告**: `Some chunks are larger than 500 kB after minification`

**原因**: バンドルサイズが大きい

**解決方法（オプション）**:

- Dynamic import を使用してコード分割
- `build.rollupOptions.output.manualChunks` で手動チャンク設定
- `build.chunkSizeWarningLimit` で警告閾値を調整

### 4. TypeScriptエラー

**エラー**: 型エラーでビルドが失敗

**解決方法**:

```bash
# 型チェックのみ実行
bun run typecheck

# エラーを確認して修正後、ビルド
bun run build
```

## 関連コマンド

| コマンド            | 説明                       |
| ------------------- | -------------------------- |
| `bun run build`     | 本番用ビルド               |
| `bun run dev`       | 開発サーバー起動           |
| `bun run preview`   | ビルド成果物のプレビュー   |
| `bun run typecheck` | TypeScript型チェック       |
| `bun run lint`      | ESLintによるコードチェック |

## 参考リンク

- [Vite公式ドキュメント](https://vite.dev/)
- [Bun公式ドキュメント](https://bun.sh/)
- [Cloudflare Pagesデプロイ設定](./DEPLOYMENT_SETUP.md)
