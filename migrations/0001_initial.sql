-- TypeFlow 初期スキーマ
-- Cloudflare D1用マイグレーション

-- Words テーブル
CREATE TABLE IF NOT EXISTS words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  reading TEXT NOT NULL,
  romaji TEXT NOT NULL,
  correct INTEGER DEFAULT 0,
  miss INTEGER DEFAULT 0,
  last_played INTEGER DEFAULT 0,
  accuracy REAL DEFAULT 100,
  created_at INTEGER NOT NULL,
  mastery_level INTEGER DEFAULT 0,
  next_review_at INTEGER DEFAULT 0,
  consecutive_correct INTEGER DEFAULT 0
);

-- Aggregated Stats テーブル
CREATE TABLE IF NOT EXISTS aggregated_stats (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  key_stats TEXT NOT NULL DEFAULT '{}',
  transition_stats TEXT NOT NULL DEFAULT '{}',
  last_updated INTEGER NOT NULL
);

-- Settings テーブル
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  word_count TEXT NOT NULL DEFAULT 'all',
  theme TEXT NOT NULL DEFAULT 'dark',
  practice_mode TEXT NOT NULL DEFAULT 'balanced',
  srs_enabled INTEGER NOT NULL DEFAULT 1,
  warmup_enabled INTEGER NOT NULL DEFAULT 1,
  difficulty_preset TEXT NOT NULL DEFAULT 'normal',
  time_limit_mode TEXT NOT NULL DEFAULT 'adaptive',
  fixed_time_limit REAL NOT NULL DEFAULT 10,
  comfort_zone_ratio REAL NOT NULL DEFAULT 0.85,
  min_time_limit REAL NOT NULL DEFAULT 1.5,
  max_time_limit REAL NOT NULL DEFAULT 15,
  miss_penalty_enabled INTEGER NOT NULL DEFAULT 1,
  base_penalty_percent REAL NOT NULL DEFAULT 5,
  penalty_escalation_factor REAL NOT NULL DEFAULT 1.5,
  max_penalty_percent REAL NOT NULL DEFAULT 30,
  min_time_after_penalty REAL NOT NULL DEFAULT 0.5,
  updated_at INTEGER NOT NULL
);

-- Game Scores テーブル
CREATE TABLE IF NOT EXISTS game_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kps REAL NOT NULL,
  total_keystrokes INTEGER NOT NULL,
  accuracy REAL NOT NULL,
  correct_words INTEGER NOT NULL,
  perfect_words INTEGER NOT NULL,
  total_words INTEGER NOT NULL,
  total_time REAL NOT NULL,
  played_at INTEGER NOT NULL
);

