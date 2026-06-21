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

.PHONY: init setup start stop reset logs

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

## 毎日の起動
start:
	npx supabase start
	docker-compose up

## 停止
stop:
	docker-compose down
	npx supabase stop

## DB をリセットしてマイグレーションを再適用
reset:
	npx supabase db reset

## Supabase のログ確認
logs:
	npx supabase logs
