-- TypeFlow マイグレーション: ユーザープリセット管理テーブルを追加
-- ユーザーが現在の単語リストと統計データを保存・復元できるようにする

-- User Presets テーブル（ユーザーが保存したプリセットのメタデータ）
CREATE TABLE IF NOT EXISTS user_presets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'normal', 'hard')),
  word_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- User Preset Words テーブル（ユーザープリセットに含まれる単語とその統計データ）
CREATE TABLE IF NOT EXISTS user_preset_words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  preset_id TEXT NOT NULL,
  text TEXT NOT NULL,
  reading TEXT NOT NULL,
  romaji TEXT NOT NULL,
  word_order INTEGER NOT NULL DEFAULT 0,
  -- 統計データ
  correct INTEGER DEFAULT 0,
  miss INTEGER DEFAULT 0,
  last_played INTEGER DEFAULT 0,
  accuracy REAL DEFAULT 100,
  mastery_level INTEGER DEFAULT 0,
  next_review_at INTEGER DEFAULT 0,
  consecutive_correct INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (preset_id) REFERENCES user_presets(id) ON DELETE CASCADE
);

-- インデックスを作成（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_user_preset_words_preset_id ON user_preset_words(preset_id);
CREATE INDEX IF NOT EXISTS idx_user_preset_words_order ON user_preset_words(preset_id, word_order);

