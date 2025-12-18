-- TypeFlow マイグレーション: プリセット管理テーブルを追加
-- プリセットデータをクラウド上で管理するためのテーブル

-- Presets テーブル（プリセットのメタデータ）
CREATE TABLE IF NOT EXISTS presets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'normal', 'hard')),
  word_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Preset Words テーブル（プリセットに含まれる単語）
CREATE TABLE IF NOT EXISTS preset_words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  preset_id TEXT NOT NULL,
  text TEXT NOT NULL,
  reading TEXT NOT NULL,
  romaji TEXT NOT NULL,
  word_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (preset_id) REFERENCES presets(id) ON DELETE CASCADE
);

-- インデックスを作成（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_preset_words_preset_id ON preset_words(preset_id);

CREATE INDEX IF NOT EXISTS idx_preset_words_order ON preset_words(preset_id, word_order);

