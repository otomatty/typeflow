-- TypeFlow マイグレーション: ユーザーごとのデータ分離を完成させる
--
-- 背景:
--   0006 で words / aggregated_stats / settings / game_scores / user_presets に
--   user_id 列を追加したが、aggregated_stats と settings は
--   `id INTEGER PRIMARY KEY CHECK (id = 1)` のシングルトン制約のままだった。
--   SQLite では CHECK 制約や PRIMARY KEY を ALTER で変更できないため、
--   テーブルを作り直して user_id を主キーに移行する。
--
-- 注意:
--   user_id が NULL の既存レコード（認証導入前のデータ）は特定のユーザーに
--   帰属できないため、移行時に破棄される。これは意図的（データ分離の担保）。

-- ---------------------------------------------------------------------------
-- aggregated_stats: user_id を主キーに
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aggregated_stats_new (
  user_id TEXT PRIMARY KEY,
  key_stats TEXT NOT NULL DEFAULT '{}',
  transition_stats TEXT NOT NULL DEFAULT '{}',
  last_updated INTEGER NOT NULL
);

INSERT INTO aggregated_stats_new (user_id, key_stats, transition_stats, last_updated)
SELECT user_id, key_stats, transition_stats, last_updated
FROM aggregated_stats
WHERE user_id IS NOT NULL;

DROP TABLE aggregated_stats;
ALTER TABLE aggregated_stats_new RENAME TO aggregated_stats;

-- ---------------------------------------------------------------------------
-- settings: user_id を主キーに
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings_new (
  user_id TEXT PRIMARY KEY,
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
  min_time_limit_by_difficulty REAL NOT NULL DEFAULT 1.5,
  miss_penalty_enabled INTEGER NOT NULL DEFAULT 1,
  base_penalty_percent REAL NOT NULL DEFAULT 5,
  penalty_escalation_factor REAL NOT NULL DEFAULT 1.5,
  max_penalty_percent REAL NOT NULL DEFAULT 30,
  min_time_after_penalty REAL NOT NULL DEFAULT 0.5,
  updated_at INTEGER NOT NULL
);

INSERT INTO settings_new (
  user_id, word_count, theme, practice_mode, srs_enabled, warmup_enabled,
  difficulty_preset, time_limit_mode, fixed_time_limit, comfort_zone_ratio,
  min_time_limit, max_time_limit, min_time_limit_by_difficulty,
  miss_penalty_enabled, base_penalty_percent, penalty_escalation_factor,
  max_penalty_percent, min_time_after_penalty, updated_at
)
SELECT
  user_id, word_count, theme, practice_mode, srs_enabled, warmup_enabled,
  difficulty_preset, time_limit_mode, fixed_time_limit, comfort_zone_ratio,
  min_time_limit, max_time_limit, min_time_limit_by_difficulty,
  miss_penalty_enabled, base_penalty_percent, penalty_escalation_factor,
  max_penalty_percent, min_time_after_penalty, updated_at
FROM settings
WHERE user_id IS NOT NULL;

DROP TABLE settings;
ALTER TABLE settings_new RENAME TO settings;

-- ---------------------------------------------------------------------------
-- パフォーマンス: user_id でフィルタしつつ並び替えるための複合インデックス
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_words_user_created ON words(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_words_user_next_review ON words(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_game_scores_user_played ON game_scores(user_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_presets_user_updated ON user_presets(user_id, updated_at DESC);
