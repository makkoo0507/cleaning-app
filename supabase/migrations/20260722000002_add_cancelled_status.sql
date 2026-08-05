-- jobs テーブルの status check 制約に cancelled を追加
ALTER TABLE jobs DROP CONSTRAINT jobs_status_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check
  CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled'));
