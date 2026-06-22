"use client";

import { useActionState, useState, useTransition } from "react";
import {
  updateLineSettings,
  verifyToken,
  type SettingsFormState,
  type VerifyTokenState,
} from "./actions";
import { Field, TextInput } from "@/components/ui";

const TEST_DESCRIPTION =
  "チャネルアクセストークン（長期）とチャネルシークレットの設定に問題ないかテストします。";

export default function SettingsForm({
  tokenSet,
  secretSet,
}: {
  tokenSet: boolean;
  secretSet: boolean;
}) {
  const [state, formAction, pending] = useActionState<
    SettingsFormState,
    FormData
  >(updateLineSettings, {});

  const [verify, setVerify] = useState<VerifyTokenState>({});
  const [verifying, startVerify] = useTransition();

  function runVerify() {
    startVerify(async () => setVerify(await verifyToken()));
  }

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <Field
        label="チャネルアクセストークン（長期）"
        hint={
          tokenSet
            ? "設定済み。変更する場合のみ入力（空欄なら据え置き）"
            : "未設定。Messaging API チャネルの「チャネルアクセストークン（長期）」を貼り付け"
        }
      >
        <TextInput
          name="line_channel_access_token"
          type="password"
          autoComplete="off"
          placeholder={tokenSet ? "●●●●（設定済み）" : ""}
        />
      </Field>

      <Field
        label="チャネルシークレット"
        hint={
          secretSet
            ? "設定済み。変更する場合のみ入力（空欄なら据え置き）"
            : "未設定。Messaging API チャネルの「チャネルシークレット」を貼り付け"
        }
      >
        <TextInput
          name="line_channel_secret"
          type="password"
          autoComplete="off"
          placeholder={secretSet ? "●●●●（設定済み）" : ""}
        />
      </Field>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.success && <p className="text-sm text-green-600">保存しました。</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {pending ? "保存中…" : "保存"}
        </button>

        <button
          type="button"
          onClick={runVerify}
          disabled={verifying}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          {verifying ? "確認中…" : "接続テスト"}
        </button>

        {/* インフォメーションアイコン: ホバーで説明 */}
        <span className="group relative inline-flex">
          <span
            className="flex h-5 w-5 cursor-help items-center justify-center rounded-full border border-zinc-400 text-xs text-zinc-500"
            aria-label={TEST_DESCRIPTION}
          >
            i
          </span>
          <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-64 -translate-x-1/2 rounded-md bg-zinc-900 px-3 py-2 text-xs leading-5 text-white group-hover:block dark:bg-zinc-700">
            {TEST_DESCRIPTION}
          </span>
        </span>
      </div>

      {verify.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          <p>{verify.error}</p>
          {verify.secretSet === false && (
            <p className="mt-1 text-xs">※ チャネルシークレットも未登録です。</p>
          )}
        </div>
      )}
      {verify.success && (
        <div
          className={
            verify.secretSet
              ? "rounded-md border border-green-200 bg-green-50 px-3 py-2 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
              : "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          }
        >
          <p className="text-sm">
            チャネルシークレット: {verify.secretSet ? "設定済み" : "未設定"}
          </p>
          <p className="mt-1 text-xs">
            トークンは有効です
            {verify.accountName ? `（公式アカウント: ${verify.accountName}）` : ""}
            。
          </p>
        </div>
      )}
    </form>
  );
}
