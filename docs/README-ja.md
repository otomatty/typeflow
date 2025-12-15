# TypeFlow

<div align="center">

**デベロッパー向けタイピング練習アプリ**

ビルド待ち時間や作業の合間に、技術用語やコード断片をマスターするための軽量なウィジェット型タイピング練習アプリケーション。

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](https://opensource.org/licenses/AGPL-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)

[English version](../README.md)

</div>

---

## ✨ 機能

- **🎯 ウィジェットファーストデザイン**: 極小ウィンドウ（高さ150px程度）でも全機能が正常に動作
- **📚 カスタム単語管理**: 技術用語、コード断片、任意の日本語テキストを追加可能
- **🤖 自動処理**: `wanakana`を使用した自動ひらがな・ローマ字生成
- **⏱️ タイムアタックモード**: 適応的な制限時間付きサバイバル型タイピング
- **📊 弱点追跡**: SRS（間隔反復システム）を使用した苦手単語の重点練習
- **📈 分析機能**: リアルタイムWPM、正確率、詳細なキーストローク統計
- **🌐 多言語対応**: 英語・日本語インターフェース
- **💾 ローカルファースト**: すべてのデータをブラウザのIndexedDBに保存 - サーバー不要、ログイン不要
- **⌨️ キーボードショートカット**: パワーユーザー向けの完全キーボード操作

## 🚀 クイックスタート

### 前提条件

- Node.js 18+（またはBun）
- npm、yarn、pnpm、またはbun

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/otomatty/typeflow.git
cd typeflow

# 依存関係をインストール
npm install
# または
bun install

# 開発サーバーを起動
npm run dev
# または
bun dev
```

ブラウザで [http://localhost:5173](http://localhost:5173) を開きます。

### 本番ビルド

```bash
npm run build
# または
bun run build
```

ビルドされたファイルは `dist` ディレクトリに出力されます。

## 📖 使い方

1. **単語を追加**: ヘッダーの「単語」をクリック、または `Cmd+K`（Mac）/ `Ctrl+K`（Windows/Linux）を押して新しい単語を追加
2. **ゲーム開始**: メニュー画面で `Space` または `Enter` を押して開始
3. **タイピング**: 表示された日本語テキストのローマ字を入力。正解すると時間が回復！
4. **復習**: ゲームオーバー後、`R` を押して弱点単語を再挑戦、または `Enter` で再開

### キーボードショートカット

- `Space` / `Enter`: ゲーム開始（メニュー画面）
- `Esc`: ゲーム終了 / メニューに戻る
- `R`: 弱点単語を再挑戦（ゲームオーバー画面）
- `Cmd+K` / `Ctrl+K`: 単語追加ダイアログを開く
- `Enter`: ダイアログを確定
- `Esc`: ダイアログを閉じる

## 🛠️ 技術スタック

- **フレームワーク**: React 19 + Vite
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **UIコンポーネント**: Radix UI
- **アニメーション**: Framer Motion
- **日本語処理**: wanakana
- **ストレージ**: @github/spark (useKV) for IndexedDB
- **i18n**: i18next

## 📁 プロジェクト構造

```
typeflow/
├── src/
│   ├── components/     # Reactコンポーネント
│   ├── hooks/          # カスタムReactフック
│   ├── lib/            # ユーティリティと型定義
│   ├── i18n/           # 国際化
│   └── styles/         # グローバルスタイル
├── docs/               # ドキュメント
├── public/             # 静的アセット
└── dist/               # ビルド出力
```

## 🤝 コントリビューション

コントリビューションを歓迎します！ガイドラインについては [CONTRIBUTING.md](../CONTRIBUTING.md) をご覧ください。

### 開発環境のセットアップ

1. リポジトリをフォーク
2. 機能ブランチを作成: `git checkout -b feature/amazing-feature`
3. 変更を加える
4. テストを実行（利用可能な場合）: `npm test`
5. 変更をコミット: `git commit -m '素晴らしい機能を追加'`
6. ブランチにプッシュ: `git push origin feature/amazing-feature`
7. プルリクエストを開く

## 📝 ライセンス

このプロジェクトは **GNU Affero General Public License v3.0 (AGPL-3.0)** の下でライセンスされています。

詳細は [LICENSE](../LICENSE) をご覧ください。

**重要**: このソフトウェアを改変してWebサービスとして公開する場合、同じライセンスの下でソースコードを提供する必要があります。

## 🔒 セキュリティ

セキュリティの脆弱性を発見した場合は、メンテナーにメールでお知らせください。詳細は [SECURITY.md](../SECURITY.md) をご覧ください。

## 🙏 謝辞

- [wanakana](https://github.com/WaniKani/wana-kana) - 日本語テキスト処理
- [Radix UI](https://www.radix-ui.com/) - アクセシブルなUIコンポーネント
- [Framer Motion](https://www.framer.com/motion/) - スムーズなアニメーション

## 📧 連絡先

- **リポジトリ**: [otomatty/typeflow](https://github.com/otomatty/typeflow)
- **Issues**: [GitHub Issues](https://github.com/otomatty/typeflow/issues)

---

<div align="center">

開発者がより速くタイピングできるように ❤️ を込めて作成

</div>
