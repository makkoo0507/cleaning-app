-- job_assignees と jobs のRLSポリシーが相互参照し、無限再帰(42P17)を起こしていたのを修正。
-- job_assignees に contractor_id を非正規化し、jobs テーブルを参照せずに
-- テナントチェックできるようにする。

ALTER TABLE job_assignees ADD COLUMN contractor_id UUID REFERENCES contractors(id);

UPDATE job_assignees ja
SET contractor_id = j.contractor_id
FROM jobs j
WHERE j.id = ja.job_id;

ALTER TABLE job_assignees ALTER COLUMN contractor_id SET NOT NULL;
CREATE INDEX idx_job_assignees_contractor_id ON job_assignees(contractor_id);

-- jobs を参照しない管理者ポリシーに差し替え（循環参照の解消）
DROP POLICY IF EXISTS "管理者がアサインを管理" ON job_assignees;
CREATE POLICY "管理者がアサインを管理" ON job_assignees
  FOR ALL
  USING (
    contractor_id = my_company_id()
    AND my_role() IN ('contractor_admin', 'contractor_vendor')
  );

-- authenticated には SELECT しか付与していなかったため INSERT/UPDATE/DELETE が拒否されていた
-- RLS で保護されるため ALL 付与でも安全
GRANT ALL ON job_assignees TO authenticated;
