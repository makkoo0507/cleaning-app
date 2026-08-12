-- 業者ごとに独立したLINEログイン(LIFF)チャネルを持たせるためのカラム。
-- LIFFのuserIdはプロバイダー単位で決まるため、業者のMessaging APIチャネルと
-- 同じプロバイダー内のLIFFチャネルでないと通知(push API)が失敗する。
ALTER TABLE contractors ADD COLUMN liff_id TEXT;
