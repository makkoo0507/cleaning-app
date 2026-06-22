"use client";

import { useActionState } from "react";
import { testSend, type TestSendState } from "./actions";
import { Field, Select } from "@/components/ui";

const ROLE_LABEL: Record<string, string> = {
  cleaner: "清掃者",
  contact: "オーナー/関係者",
  contractor_admin: "管理者",
  contractor_staff: "社員",
};

export default function TestSend({
  recipients,
}: {
  recipients: { id: string; name: string; role: string }[];
}) {
  const [state, formAction, pending] = useActionState<TestSendState, FormData>(
    testSend,
    {}
  );

  if (recipients.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        LINE 紐付け済みのユーザーがいないため、テスト送信できません。
        清掃者・オーナーを招待 URL から紐付けてください。
      </p>
    );
  }

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <Field label="送信先（LINE紐付け済みユーザー）" required>
        <Select name="user_id" required defaultValue="">
          <option value="" disabled>
            選択してください
          </option>
          {recipients.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}（{ROLE_LABEL[r.role] ?? r.role}）
            </option>
          ))}
        </Select>
      </Field>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-green-600">
          テストメッセージを送信しました。相手の LINE をご確認ください。
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
      >
        {pending ? "送信中…" : "テスト送信"}
      </button>
    </form>
  );
}
