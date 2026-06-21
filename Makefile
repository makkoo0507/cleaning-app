# ============================================================
# 前提条件（Mac にインストールするもの）
#   1. Docker Desktop（起動しておくこと）
#   2. Node.js v20+（supabase コマンドの実行に使用）
#
# 初回の手順:
#   1. make init        → Next.js 雛形を作成（リポジトリ作成者のみ）
#   2. make setup       → Docker ビルド + Supabase 起動 + DB 初期化
#
# 毎日の手順:
#   make start
#
# デモログイン:
#   メール:     admin@example.com
#   パスワード: password123
# ============================================================

.PHONY: init setup start stop reset logs logs-app tunnel

# LIFF 実機テスト用 ngrok 固定ドメイン
NGROK_DOMAIN = monotype-bungee-province.ngrok-free.dev

## Step 1: Next.js の雛形を作成（リポジトリ作成者のみ実行。clone した場合は不要）
init:
	mkdir -p next
	docker run --rm \
		-v $(PWD)/next:/workspace \
		node:20-alpine \
		sh -c "npx create-next-app@latest /tmp/scaffold \
			--typescript --eslint --tailwind --app \
			--no-src-dir --import-alias '@/*' --no-git \
			&& cp -a /tmp/scaffold/. /workspace/"
	@echo ""
	@echo "✅ scaffold 完了。続けて make setup を実行してください。"

## Step 2: Docker ビルド + Supabase 起動 + DB 初期化（初回のみ）
setup:
	cp -n .env.local.example .env.local || true
	docker-compose build
	npx supabase start
	npx supabase db reset
	@echo ""
	@echo "✅ セットアップ完了。make start で起動できます。"
	@echo "   デモログイン: admin@example.com / password123"

## 毎日の起動（Supabase + Next.js + ngrok トンネル）
## Next.js はバックグラウンド(-d)で起動し、ngrok をフォアグラウンドで実行してトンネルを維持する。
## Next.js のログは別ターミナルで `make logs-app`、停止は Ctrl+C 後に `make stop`。
start:
	npx supabase start
	docker-compose up -d
	@echo ""
	@echo "✅ 起動しました"
	@echo "   Next.js:         http://localhost:3000"
	@echo "   Supabase Studio: http://localhost:54323"
	@echo "   公開URL(ngrok):  https://$(NGROK_DOMAIN)"
	@echo "   デモログイン:    admin@example.com / password123"
	@echo ""
	@echo "ngrok トンネルを起動します（Ctrl+C で停止。Next.js/Supabase は動き続けます）"
	ngrok http 3000 --url=https://$(NGROK_DOMAIN)

## ngrok トンネルのみ起動
tunnel:
	ngrok http 3000 --url=https://$(NGROK_DOMAIN)

## 停止
stop:
	-pkill -f "ngrok http 3000" || true
	docker-compose down
	npx supabase stop

## DB をリセットしてマイグレーションを再適用
reset:
	npx supabase db reset

## Supabase のログ確認
logs:
	npx supabase logs

## Next.js のログ確認（フォロー表示）
logs-app:
	docker-compose logs -f app
