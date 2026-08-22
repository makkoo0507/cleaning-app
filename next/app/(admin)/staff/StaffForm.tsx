"use client";

import Link from "@/components/Link";
import { useActionState } from "react";
import type { StaffFormState } from "./actions";
import { Field, TextInput, Select, Alert, PendingLabel } from "@/components/ui";

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
    role?: string;
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

      <Field label="メールアドレス" required>
        <TextInput
          name="email"
          type="email"
          required
          autoComplete="off"
          defaultValue={defaultValues?.email ?? ""}
        />
      </Field>

      <Field label="権限" required hint="管理者=全操作可 / 閲覧者=閲覧のみ">
        <Select name="role" defaultValue={defaultValues?.role ?? "contractor_viewer"}>
          <option value="contractor_viewer">閲覧者</option>
          <option value="contractor_admin">管理者</option>
        </Select>
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

      {state.error && <Alert variant="error" inline>{state.error}</Alert>}
      {state.success && <Alert variant="success" inline>保存しました。</Alert>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          <PendingLabel pending={pending}>{pending ? "保存中…" : "保存"}</PendingLabel>
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
