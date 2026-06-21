"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { OwnerFormState } from "./actions";
import type { Property } from "@/lib/database.types";
import { Field, TextInput, Select } from "@/components/ui";

type Action = (
  prev: OwnerFormState,
  formData: FormData
) => Promise<OwnerFormState>;

export interface OwnerDefaults {
  name?: string;
  company_name?: string | null;
  phone?: string | null;
  billing_address?: string | null;
  memberships?: { property_id: string; role: string; notify: boolean }[];
}

interface Row {
  key: string;
  propertyId: string;
  role: string;
  notify: boolean;
}

export default function OwnerForm({
  action,
  properties,
  defaultValues,
}: {
  action: Action;
  properties: Pick<Property, "id" | "name">[];
  defaultValues?: OwnerDefaults;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  const [rows, setRows] = useState<Row[]>(
    (defaultValues?.memberships ?? []).map((m, i) => ({
      key: `init-${i}`,
      propertyId: m.property_id,
      role: m.role,
      notify: m.notify,
    }))
  );

  const addRow = () =>
    setRows((r) => [
      ...r,
      { key: crypto.randomUUID(), propertyId: "", role: "owner", notify: true },
    ]);

  const removeRow = (key: string) =>
    setRows((r) => r.filter((row) => row.key !== key));

  const update = (key: string, patch: Partial<Row>) =>
    setRows((r) => r.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="名前" required>
          <TextInput name="name" type="text" required defaultValue={defaultValues?.name ?? ""} />
        </Field>
        <Field label="所属会社名">
          <TextInput name="company_name" type="text" defaultValue={defaultValues?.company_name ?? ""} />
        </Field>
        <Field label="電話番号">
          <TextInput name="phone" type="tel" defaultValue={defaultValues?.phone ?? ""} />
        </Field>
        <Field label="請求先住所">
          <TextInput name="billing_address" type="text" defaultValue={defaultValues?.billing_address ?? ""} />
        </Field>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          担当物件・役割・通知設定
        </p>

        {properties.length === 0 ? (
          <p className="text-sm text-zinc-500">先に物件を登録してください。</p>
        ) : (
          <div className="space-y-3">
            {rows.length === 0 && (
              <p className="text-sm text-zinc-500">
                「+ 物件を追加」で担当物件を追加してください。
              </p>
            )}

            {rows.map((row) => (
              <div
                key={row.key}
                className="flex flex-wrap items-center gap-3 rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800"
              >
                <Select
                  name={`property_id_${row.key}`}
                  value={row.propertyId}
                  onChange={(e) => update(row.key, { propertyId: e.target.value })}
                  required
                  className="w-56"
                >
                  <option value="" disabled>
                    物件を選択
                  </option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>

                <Select
                  name={`role_${row.key}`}
                  value={row.role}
                  onChange={(e) => update(row.key, { role: e.target.value })}
                  className="w-32"
                >
                  <option value="owner">オーナー</option>
                  <option value="operations">運用担当</option>
                  <option value="sales">営業</option>
                </Select>

                <label className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                  <input
                    type="checkbox"
                    name={`notify_${row.key}`}
                    checked={row.notify}
                    onChange={(e) => update(row.key, { notify: e.target.checked })}
                  />
                  LINE通知
                </label>

                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  className="ml-auto text-red-600 underline hover:text-red-800"
                >
                  削除
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addRow}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              + 物件を追加
            </button>
          </div>
        )}
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
          href="/owners"
          className="text-sm text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          キャンセル
        </Link>
      </div>
    </form>
  );
}
