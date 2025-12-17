-- TypeFlow マイグレーション: min_time_limit_by_difficulty カラムを追加
-- 難易度ごとの最低制限時間を設定できるようにする

ALTER TABLE settings ADD COLUMN min_time_limit_by_difficulty REAL NOT NULL DEFAULT 1.5;

