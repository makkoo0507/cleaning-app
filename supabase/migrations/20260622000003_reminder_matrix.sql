-- リマインド設定を「送信先 × タイミング」のマトリクスに変更。
-- 清掃者・オーナーそれぞれで前日/当日を個別に設定できるようにする。

alter table public.contractor_companies
  add column reminder_cleaner_prev_day boolean not null default true,
  add column reminder_cleaner_same_day boolean not null default false,
  add column reminder_owner_prev_day   boolean not null default false,
  add column reminder_owner_same_day   boolean not null default false;

-- 旧フラグ（送信先 と タイミングの独立指定）から移行
update public.contractor_companies set
  reminder_cleaner_prev_day = (reminder_to_cleaner and reminder_prev_day),
  reminder_cleaner_same_day = (reminder_to_cleaner and reminder_same_day),
  reminder_owner_prev_day   = (reminder_to_owner   and reminder_prev_day),
  reminder_owner_same_day   = (reminder_to_owner   and reminder_same_day);

alter table public.contractor_companies
  drop column reminder_to_cleaner,
  drop column reminder_to_owner,
  drop column reminder_prev_day,
  drop column reminder_same_day;
