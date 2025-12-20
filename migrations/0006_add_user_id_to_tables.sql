-- TypeFlow マイグレーション: 既存テーブルにuser_idカラムを追加
-- すべてのユーザー固有データテーブルにuser_idを追加してデータ分離を実現

-- Words テーブルにuser_idを追加
ALTER TABLE words ADD COLUMN user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_words_user_id ON words(user_id);

-- Aggregated Stats テーブルにuser_idを追加
-- id = 1 の制約を削除する必要があるが、SQLiteでは制約の削除ができないため
-- 新しいテーブル構造に移行するか、user_idベースのクエリを使用
ALTER TABLE aggregated_stats ADD COLUMN user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_aggregated_stats_user_id ON aggregated_stats(user_id);

-- Settings テーブルにuser_idを追加
ALTER TABLE settings ADD COLUMN user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);

-- Game Scores テーブルにuser_idを追加
ALTER TABLE game_scores ADD COLUMN user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON game_scores(user_id);

-- User Presets テーブルにuser_idを追加
ALTER TABLE user_presets ADD COLUMN user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_user_presets_user_id ON user_presets(user_id);

