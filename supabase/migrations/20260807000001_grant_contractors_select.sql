-- contractors テーブルへの SELECT 権限が authenticated ロールに付与されておらず、
-- RLS ポリシー（自社のみ参照）があっても PostgreSQL レベルで拒否されていた。
-- RLS で自社行に絞られるため GRANT しても安全。
GRANT SELECT ON contractors TO authenticated;
