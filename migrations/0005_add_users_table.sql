-- TypeFlow マイグレーション: ユーザー認証テーブルを追加
-- マルチユーザー対応の基盤となるusersテーブルを作成

-- Users テーブル
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,  -- UUID v4
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,  -- bcryptハッシュ
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_login_at INTEGER
);

-- インデックスを作成（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

