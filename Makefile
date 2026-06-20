# ============================================================
# 前提条件（Mac にインストールするもの）
#   1. Docker Desktop（起動しておくこと）
#   2. Node.js v20+（supabase コマンドの実行に使用）
#
# 初回の手順:
#   1. make init        → Next.js 雛形を作成
#   2. make setup       → Docker ビルド + Supabase 起動
#   3. .env.local を編集（表示された anon key などを貼り付け）
#   4. docker-compose up → http://localhost:3000 で確認
#
# 毎日の手順:
#   make start
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

## Step 2: Docker ビルド + Supabase 起動（初回のみ）
setup:
	cp -n .env.local.example .env.local || true
	docker-compose build
	npx supabase start
	@echo ""
	@echo "✅ Supabase が起動しました。"
	@echo "   上記の anon key と service_role_key を .env.local に貼り付けてください。"
	@echo "   完了後: docker-compose up"

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
