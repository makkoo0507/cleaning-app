-- 物件にデフォルト開始時刻を追加
alter table properties
  add column if not exists default_start_time time default null;
