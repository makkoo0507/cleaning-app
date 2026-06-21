"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { StaffFormState } from "./actions";
import { Field, TextInput } from "@/components/ui";

type Action = (
  prev: StaffFormState,
  formData: FormData
) => Promise<StaffFormState>;

export default function StaffForm({
  action,
  defaultValues,
  isEdit,
}: {
  action: Action;
  defaultValues?: {
    name?: string;
    email?: string;
    department?: string | null;
    employee_code?: string | null;
  };
  isEdit?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <Field label="名前" required>
        <TextInput name="name" type="text" required defaultValue={defaultValues?.name ?? ""} />
      </Field>

      <Field label="メールアドレス" required={!isEdit}>
        {isEdit ? (
          <TextInput
            type="email"
            defaultValue={defaultValues?.email ?? ""}
            disabled
          />
        ) : (
          <TextInput name="email" type="email" required autoComplete="off" />
        )}
      </Field>

      <Field
        label={isEdit ? "パスワード（変更する場合のみ）" : "パスワード"}
        required={!isEdit}
        hint="8文字以上"
      >
        <TextInput
          name="password"
          type="password"
          required={!isEdit}
          autoComplete="new-password"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="部署">
          <TextInput name="department" type="text" defaultValue={defaultValues?.department ?? ""} />
        </Field>
        <Field label="社員番号">
          <TextInput name="employee_code" type="text" defaultValue={defaultValues?.employee_code ?? ""} />
        </Field>
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {pending ? "保存中…" : "保存"}
        </button>
        <Link
          href="/staff"
          className="text-sm text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          キャンセル
        </Link>
      </div>
    </form>
  );
}
