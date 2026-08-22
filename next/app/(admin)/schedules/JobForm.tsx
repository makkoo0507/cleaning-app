"use client";

import Link from "@/components/Link";
import { useState, useActionState } from "react";
import type { JobFormState } from "./actions";
import type { Job, JobAssignee, Property, User } from "@/lib/database.types";
import { Field, TextInput, Select, Alert, PendingLabel } from "@/components/ui";

type Action = (
  prev: JobFormState,
  formData: FormData
) => Promise<JobFormState>;

type PropertyDefault = { billing: number | null; payment: number | null; startTime: string | null };
type RequestPreset = {
  request_id: string;
  property_id: string;
  scheduled_date: string;
  scheduled_start_time: string | null;
  note: string | null;
};

const MAX_ASSIGNEES = 5;

type AssigneeSlot = { cleanerId: string; paymentAmount: string };

function buildInitialSlots(assignees: JobAssignee[] | undefined, defaultPayment: number | null): AssigneeSlot[] {
  const slots: AssigneeSlot[] = Array.from({ length: MAX_ASSIGNEES }, () => ({ cleanerId: "", paymentAmount: "" }));
  if (assignees) {
    for (const a of assignees) {
      if (a.slot >= 1 && a.slot <= MAX_ASSIGNEES) {
        slots[a.slot - 1] = {
          cleanerId: a.cleaner_id,
          paymentAmount: a.payment_amount != null ? String(a.payment_amount) : "",
        };
      }
    }
  } else if (defaultPayment != null) {
    slots[0] = { ...slots[0], paymentAmount: String(defaultPayment) };
  }
  return slots;
}

export default function JobForm({
  action,
  properties,
  cleaners,
  job,
  assignees,
  propertyDefaults = {},
  requestPreset,
}: {
  action: Action;
  properties: Pick<Property, "id" | "name">[];
  cleaners: Pick<User, "id" | "name">[];
  job?: Job;
  assignees?: JobAssignee[];
  propertyDefaults?: Record<string, PropertyDefault>;
  requestPreset?: RequestPreset | null;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  const [status, setStatus] = useState<string>(job?.status ?? "scheduled");
  const [billingAmount, setBillingAmount] = useState<string>(
    job?.billing_amount != null ? String(job.billing_amount) : ""
  );
  const [startTime, setStartTime] = useState<string>(
    job?.scheduled_start_time?.slice(0, 5) ?? requestPreset?.scheduled_start_time?.slice(0, 5) ?? ""
  );
  const [slots, setSlots] = useState<AssigneeSlot[]>(() => buildInitialSlots(assignees, null));

  function updateSlot(index: number, patch: Partial<AssigneeSlot>) {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  // 枠は前詰めでのみ入力可能（1番目が空なら2番目以降は無効）
  function isSlotEnabled(index: number): boolean {
    if (index === 0) return true;
    return slots[index - 1].cleanerId !== "";
  }

  function handlePropertyChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (job) return; // 編集時はデフォルトを上書きしない
    const defaults = propertyDefaults[e.target.value];
    if (defaults) {
      setBillingAmount(defaults.billing != null ? String(defaults.billing) : "");
      setStartTime(defaults.startTime?.slice(0, 5) ?? "");
      setSlots((prev) => {
        const next = [...prev];
        next[0] = { ...next[0], paymentAmount: defaults.payment != null ? String(defaults.payment) : "" };
        return next;
      });
    }
  }

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {requestPreset && (
        <input type="hidden" name="request_id" value={requestPreset.request_id} />
      )}
      <Field label="物件" required>
        <Select
          name="property_id"
          required
          defaultValue={job?.property_id ?? requestPreset?.property_id ?? ""}
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
            defaultValue={job?.scheduled_date ?? requestPreset?.scheduled_date ?? ""}
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

      <Field label="ステータス">
        <Select key={status} name="status" defaultValue={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="scheduled">予定</option>
          <option value="in_progress">作業中</option>
          <option value="completed">完了</option>
          <option value="cancelled">キャンセル</option>
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
      </div>

      <Field label="担当清掃者" hint={`最大${MAX_ASSIGNEES}名。支払い額は人ごとに設定できます`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-zinc-400">
              <th className="w-6 pb-1 text-left font-normal"></th>
              <th className="pb-1 text-left font-normal">清掃者</th>
              <th className="w-28 pb-1 text-left font-normal">支払額</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot, i) => {
              const enabled = isSlotEnabled(i);
              return (
                <tr key={i}>
                  <td className="py-1 pr-2 text-xs text-zinc-400">{i + 1}</td>
                  <td className="py-1 pr-2">
                    <Select
                      name={`assignee_cleaner_id_${i + 1}`}
                      value={slot.cleanerId}
                      disabled={!enabled}
                      onChange={(e) => {
                        const cleanerId = e.target.value;
                        updateSlot(i, { cleanerId });
                        // クリアした場合、以降の枠も連鎖的にクリア
                        if (!cleanerId) {
                          setSlots((prev) =>
                            prev.map((s, j) => (j > i ? { cleanerId: "", paymentAmount: "" } : s))
                          );
                        }
                      }}
                    >
                      <option value="">未選択</option>
                      {cleaners.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="py-1">
                    <TextInput
                      name={`assignee_payment_amount_${i + 1}`}
                      type="number"
                      min="0"
                      step="1"
                      placeholder="—"
                      disabled={!enabled || !slot.cleanerId}
                      value={slot.paymentAmount}
                      onChange={(e) => updateSlot(i, { paymentAmount: e.target.value })}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Field>

      <Field label="清掃指示" hint="清掃者のLIFFに表示されます">
        <textarea
          name="instruction"
          rows={3}
          defaultValue={job?.instruction ?? requestPreset?.note ?? ""}
          placeholder="例：エアコンフィルター掃除をお願いします"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </Field>

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
          href="/schedules"
          className="text-sm text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          キャンセル
        </Link>
      </div>
    </form>
  );
}
