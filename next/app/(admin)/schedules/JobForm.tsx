"use client";

import Link from "next/link";
import { useState, useActionState } from "react";
import type { JobFormState } from "./actions";
import type { Job, Property, User } from "@/lib/database.types";
import { Field, TextInput, Select } from "@/components/ui";

type Action = (
  prev: JobFormState,
  formData: FormData
) => Promise<JobFormState>;

type PropertyDefault = { billing: number | null; payment: number | null; startTime: string | null };

export default function JobForm({
  action,
  properties,
  cleaners,
  job,
  propertyDefaults = {},
}: {
  action: Action;
  properties: Pick<Property, "id" | "name">[];
  cleaners: Pick<User, "id" | "name">[];
  job?: Job;
  propertyDefaults?: Record<string, PropertyDefault>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  const [billingAmount, setBillingAmount] = useState<string>(
    job?.billing_amount != null ? String(job.billing_amount) : ""
  );
  const [paymentAmount, setPaymentAmount] = useState<string>(
    job?.payment_amount != null ? String(job.payment_amount) : ""
  );
  const [startTime, setStartTime] = useState<string>(
    job?.scheduled_start_time?.slice(0, 5) ?? ""
  );

  function handlePropertyChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (job) return; // 編集時はデフォルトを上書きしない
    const defaults = propertyDefaults[e.target.value];
    if (defaults) {
      setBillingAmount(defaults.billing != null ? String(defaults.billing) : "");
      setPaymentAmount(defaults.payment != null ? String(defaults.payment) : "");
      setStartTime(defaults.startTime?.slice(0, 5) ?? "");
    }
  }

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <Field label="物件" required>
        <Select
          name="property_id"
          required
          defaultValue={job?.property_id ?? ""}
          onChange={handlePropertyChange}
        >
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
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
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
            value={billingAmount}
            onChange={(e) => setBillingAmount(e.target.value)}
          />
        </Field>
        <Field label="支払い額（清掃者向け）">
          <TextInput
            name="payment_amount"
            type="number"
            min="0"
            step="1"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
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
