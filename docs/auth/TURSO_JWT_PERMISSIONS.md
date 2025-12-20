# Turso JWTテンプレート権限設定ガイド

## 現在のテーブル構造

### ユーザー固有データ（user_idで分離）

以下のテーブルは、各ユーザーが自分のデータのみアクセス可能にする必要があります：

1. **`words`** - ユーザーの単語データ
   - 操作: 読み取り、追加、更新、削除
   - 理由: ユーザーが自分の単語を管理

2. **`aggregated_stats`** - ユーザーの統計データ
   - 操作: 読み取り、更新
   - 理由: ユーザーが自分の統計を確認・更新

3. **`settings`** - ユーザーの設定
   - 操作: 読み取り、更新
   - 理由: ユーザーが自分の設定を管理

4. **`game_scores`** - ユーザーのゲームスコア
   - 操作: 読み取り、追加
   - 理由: ユーザーが自分のスコアを確認・記録

5. **`user_presets`** - ユーザーのプリセット
   - 操作: 読み取り、追加、更新、削除
   - 理由: ユーザーが自分のプリセットを管理

6. **`user_preset_words`** - ユーザープリセットの単語
   - 操作: 読み取り、追加、更新、削除
   - 理由: ユーザープリセットの一部として管理

### システム共有データ（全ユーザーで共有）

以下のテーブルは、すべてのユーザーが読み取り可能にする必要があります：

7. **`presets`** - システムプリセット
   - 操作: 読み取りのみ
   - 理由: システムが提供するプリセットは全ユーザーが利用可能

8. **`preset_words`** - システムプリセットの単語
   - 操作: 読み取りのみ
   - 理由: システムプリセットの一部として読み取りのみ

### 認証関連（Clerkを使用するため、通常は不要）

9. **`users`** - ユーザー認証テーブル
   - 操作: なし（Clerkを使用するため、通常は不要）
   - 理由: Clerkが認証を管理するため、このテーブルは使用しない可能性が高い

## 推奨される権限設定

### オプション1: シンプルな設定（フルアクセス）

すべてのテーブルに対してフルアクセス権限を付与します。
アプリケーション側で`user_id`によるフィルタリングを行います。

```bash
turso org jwks template --database typeflow-db --scope full-access
```

**メリット:**

- シンプルで管理が容易
- アプリケーション側で柔軟に制御可能

**デメリット:**

- データベースレベルでのセキュリティが弱い
- アプリケーションのバグで全データにアクセス可能になるリスク

### オプション2: テーブルレベルの細かい権限設定（推奨）

各テーブルに対して必要な権限のみを付与します。

```bash
turso org jwks template \
  --database typeflow-db \
  --permissions words:data_read,data_add,data_update,data_delete \
  --permissions aggregated_stats:data_read,data_update \
  --permissions settings:data_read,data_update \
  --permissions game_scores:data_read,data_add \
  --permissions user_presets:data_read,data_add,data_update,data_delete \
  --permissions user_preset_words:data_read,data_add,data_update,data_delete \
  --permissions presets:data_read \
  --permissions preset_words:data_read
```

**メリット:**

- データベースレベルでのセキュリティが強い
- 誤操作によるデータ損失を防止

**デメリット:**

- 設定が複雑
- テーブル追加時に権限設定が必要

### オプション3: 読み取り専用 + 書き込み可能テーブルを分離

読み取り専用テーブルと書き込み可能テーブルを明確に分離します。

```bash
turso org jwks template \
  --database typeflow-db \
  --permissions presets:data_read \
  --permissions preset_words:data_read \
  --permissions words:data_read,data_add,data_update,data_delete \
  --permissions aggregated_stats:data_read,data_update \
  --permissions settings:data_read,data_update \
  --permissions game_scores:data_read,data_add \
  --permissions user_presets:data_read,data_add,data_update,data_delete \
  --permissions user_preset_words:data_read,data_add,data_update,data_delete
```

## 権限の詳細説明

### 利用可能なアクション

- **`data_read`** - テーブルからのデータ読み取り
- **`data_add`** - 新しいデータの挿入（INSERT）
- **`data_update`** - 既存データの更新（UPDATE）
- **`data_delete`** - データの削除（DELETE）
- **`schema_update`** - テーブルスキーマの変更（ALTER TABLE）
- **`schema_add`** - 新しいテーブルの作成（CREATE TABLE）
- **`schema_delete`** - テーブルの削除（DROP TABLE）

### 各テーブルの推奨権限

| テーブル            | 読み取り | 追加 | 更新 | 削除 | 理由                                       |
| ------------------- | -------- | ---- | ---- | ---- | ------------------------------------------ |
| `words`             | ✅       | ✅   | ✅   | ✅   | ユーザーが自分の単語を完全に管理           |
| `aggregated_stats`  | ✅       | -    | ✅   | -    | 統計は更新のみ（削除は不要）               |
| `settings`          | ✅       | -    | ✅   | -    | 設定は更新のみ（削除は不要）               |
| `game_scores`       | ✅       | ✅   | -    | -    | スコアは追加のみ（更新・削除は不要）       |
| `user_presets`      | ✅       | ✅   | ✅   | ✅   | ユーザーが自分のプリセットを完全に管理     |
| `user_preset_words` | ✅       | ✅   | ✅   | ✅   | プリセットの一部として管理                 |
| `presets`           | ✅       | -    | -    | -    | システムプリセットは読み取りのみ           |
| `preset_words`      | ✅       | -    | -    | -    | システムプリセットの一部として読み取りのみ |

## 次のステップ

1. 上記のオプションから選択
2. 選択したオプションのコマンドを実行
3. ClerkのJWTテンプレートにTursoの権限を反映
4. JWKSエンドポイントをTursoに追加

## 注意事項

- **`users`テーブル**: Clerkを使用する場合、このテーブルは使用しない可能性が高いため、権限設定は不要かもしれません
- **スキーマ変更**: 通常のユーザーには`schema_*`権限は付与しないことを推奨（セキュリティリスク）
- **テスト**: 権限設定後、実際のアプリケーションで動作確認を行うことを推奨
