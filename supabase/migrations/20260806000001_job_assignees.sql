-- 複数清掃者アサイン対応: job_assignees テーブルを新設し、
-- jobs.cleaner_id / jobs.payment_amount から移行する。

CREATE TABLE job_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  cleaner_id UUID NOT NULL REFERENCES users(id),
  payment_amount NUMERIC,
  slot INT NOT NULL CHECK (slot BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, slot)
);

CREATE INDEX idx_job_assignees_job_id ON job_assignees(job_id);
CREATE INDEX idx_job_assignees_cleaner_id ON job_assignees(cleaner_id);

ALTER TABLE job_assignees ENABLE ROW LEVEL SECURITY;

-- 既存データ移行: cleaner_id が設定されているジョブを slot=1 として移行
INSERT INTO job_assignees (job_id, cleaner_id, payment_amount, slot)
SELECT id, cleaner_id, payment_amount, 1
FROM jobs
WHERE cleaner_id IS NOT NULL;

-- jobs.cleaner_id に依存する RLS ポリシーを job_assignees 経由に差し替え
DROP POLICY IF EXISTS "清掃者が自分の案件を参照" ON jobs;
CREATE POLICY "清掃者が自分の案件を参照" ON jobs
  FOR SELECT
  USING (
    contractor_id = my_company_id()
    AND my_role() = 'cleaner'
    AND EXISTS (
      SELECT 1 FROM job_assignees ja
      WHERE ja.job_id = jobs.id AND ja.cleaner_id = auth.uid()
    )
  );

-- job_assignees の RLS: 管理者は全操作、清掃者は自分の割当のみ参照
CREATE POLICY "管理者がアサインを管理" ON job_assignees
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_assignees.job_id AND j.contractor_id = my_company_id()
    )
    AND my_role() IN ('contractor_admin', 'contractor_vendor')
  );

CREATE POLICY "清掃者が自分のアサインを参照" ON job_assignees
  FOR SELECT
  USING (cleaner_id = auth.uid());

GRANT ALL ON job_assignees TO service_role;
GRANT SELECT ON job_assignees TO authenticated;

-- 他テーブルの jobs.cleaner_id 依存ポリシーを job_assignees 経由に差し替え
DROP POLICY IF EXISTS "清掃者が自分の記録を管理" ON cleaning_records;
CREATE POLICY "清掃者が自分の記録を管理" ON cleaning_records
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM job_assignees ja
      WHERE ja.job_id = cleaning_records.job_id AND ja.cleaner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "清掃者がアサイン案件の写真を閲覧" ON cleaning_images;
CREATE POLICY "清掃者がアサイン案件の写真を閲覧" ON cleaning_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM job_assignees ja
      WHERE ja.job_id = cleaning_images.job_id AND ja.cleaner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "清掃者がアサイン案件に写真をアップロード" ON cleaning_images;
CREATE POLICY "清掃者がアサイン案件に写真をアップロード" ON cleaning_images
  FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM job_assignees ja
      WHERE ja.job_id = cleaning_images.job_id AND ja.cleaner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "清掃者が未共有写真を削除" ON cleaning_images;
CREATE POLICY "清掃者が未共有写真を削除" ON cleaning_images
  FOR DELETE
  USING (
    uploaded_by = auth.uid()
    AND share_with_owner = false
    AND EXISTS (
      SELECT 1 FROM job_assignees ja
      WHERE ja.job_id = cleaning_images.job_id AND ja.cleaner_id = auth.uid()
    )
  );

-- jobs から旧カラムを削除
ALTER TABLE jobs DROP COLUMN cleaner_id;
ALTER TABLE jobs DROP COLUMN payment_amount;
