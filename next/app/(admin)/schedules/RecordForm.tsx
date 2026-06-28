"use client";

import { useActionState } from "react";
import type { RecordFormState } from "./actions";
import type { CleaningRecord } from "@/lib/database.types";
import { Field, TextInput } from "@/components/ui";

type Action = (prev: RecordFormState, formData: FormData) => Promise<RecordFormState>;

function utcToJstLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const jst = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 16);
}

export default function RecordForm({
  action,
  record,
}: {
  action: Action;
  record: CleaningRecord | null;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="開始時刻" required>
          <TextInput
            name="started_at"
            type="datetime-local"
            required
            defaultValue={utcToJstLocal(record?.started_at)}
          />
        </Field>
        <Field label="完了時刻">
          <TextInput
            name="completed_at"
            type="datetime-local"
            defaultValue={utcToJstLocal(record?.completed_at)}
          />
        </Field>
      </div>
      <Field label="共有メモ">
        <textarea
          name="memo"
          defaultValue={record?.memo ?? ""}
          rows={2}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </Field>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">保存しました。</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {pending ? "保存中…" : "記録を保存"}
      </button>
    </form>
  );
}
