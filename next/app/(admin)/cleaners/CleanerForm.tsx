"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { CleanerFormState } from "./actions";
import { Field, TextInput, Textarea } from "@/components/ui";

type Action = (
  prev: CleanerFormState,
  formData: FormData
) => Promise<CleanerFormState>;

export default function CleanerForm({
  action,
  defaultValues,
}: {
  action: Action;
  defaultValues?: { name?: string; skills?: string | null; note?: string | null };
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <Field label="名前" required>
        <TextInput name="name" type="text" required defaultValue={defaultValues?.name ?? ""} />
      </Field>

      <Field label="得意分野・資格" hint="例: 水回り清掃、リネン交換">
        <TextInput name="skills" type="text" defaultValue={defaultValues?.skills ?? ""} />
      </Field>

      <Field label="備考">
        <Textarea name="note" rows={3} defaultValue={defaultValues?.note ?? ""} />
      </Field>

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
          href="/cleaners"
          className="text-sm text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          キャンセル
        </Link>
      </div>
    </form>
  );
}
