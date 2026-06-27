"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { JobFormState } from "./actions";
import type { Job, Property, User } from "@/lib/database.types";
import { Field, TextInput, Select } from "@/components/ui";

type Action = (
  prev: JobFormState,
  formData: FormData
) => Promise<JobFormState>;

export default function JobForm({
  action,
  properties,
  cleaners,
  job,
}: {
  action: Action;
  properties: Pick<Property, "id" | "name">[];
  cleaners: Pick<User, "id" | "name">[];
  job?: Job;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <Field label="物件" required>
        <Select name="property_id" required defaultValue={job?.property_id ?? ""}>
          <option value="" disabled>
            選択してください
          </option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="清掃日" required>
          <TextInput
            name="scheduled_date"
            type="date"
            required
            defaultValue={job?.scheduled_date ?? ""}
          />
        </Field>
        <Field label="開始予定時刻">
          <TextInput
            name="scheduled_start_time"
            type="time"
            defaultValue={job?.scheduled_start_time?.slice(0, 5) ?? ""}
          />
        </Field>
      </div>

      <Field label="担当清掃者" hint="後でアサインも可能">
        <Select name="cleaner_id" defaultValue={job?.cleaner_id ?? ""}>
          <option value="">未アサイン</option>
          {cleaners.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="ステータス">
        <Select name="status" defaultValue={job?.status ?? "scheduled"}>
          <option value="scheduled">予定</option>
          <option value="in_progress">作業中</option>
          <option value="completed">完了</option>
        </Select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="請求額（オーナー向け）">
          <TextInput
            name="billing_amount"
            type="number"
            min="0"
            step="1"
            defaultValue={job?.billing_amount ?? ""}
          />
        </Field>
        <Field label="支払い額（清掃者向け）">
          <TextInput
            name="payment_amount"
            type="number"
            min="0"
            step="1"
            defaultValue={job?.payment_amount ?? ""}
          />
        </Field>
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-green-600">保存しました。</p>
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
          href="/schedules"
          className="text-sm text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          キャンセル
        </Link>
      </div>
    </form>
  );
}
