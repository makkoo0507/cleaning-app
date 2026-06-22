"use client";

import { useActionState } from "react";
import { updateLineSettings, type SettingsFormState } from "./actions";
import { Field, TextInput } from "@/components/ui";

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
      {state.success && (
        <p className="text-sm text-green-600">保存しました。</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {pending ? "保存中…" : "保存"}
      </button>
    </form>
  );
}
