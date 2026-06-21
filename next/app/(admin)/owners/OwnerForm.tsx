"use client";

import Link from "next/link";
import { useActionState } from "react";
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
  const memberMap = new Map(
    (defaultValues?.memberships ?? []).map((m) => [m.property_id, m])
  );

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
          <p className="text-sm text-zinc-500">
            先に物件を登録してください。
          </p>
        ) : (
          <div className="space-y-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
            {properties.map((p) => {
              const m = memberMap.get(p.id);
              const checked = !!m;
              return (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center gap-3 text-sm"
                >
                  <label className="flex min-w-48 items-center gap-2">
                    <input
                      type="checkbox"
                      name={`property_${p.id}`}
                      defaultChecked={checked}
                    />
                    <span className="text-zinc-900 dark:text-zinc-50">
                      {p.name}
                    </span>
                  </label>
                  <Select
                    name={`role_${p.id}`}
                    defaultValue={m?.role ?? "owner"}
                    className="w-32"
                  >
                    <option value="owner">オーナー</option>
                    <option value="operations">運用担当</option>
                    <option value="sales">営業</option>
                  </Select>
                  <label className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                    <input
                      type="checkbox"
                      name={`notify_${p.id}`}
                      defaultChecked={m?.notify ?? true}
                    />
                    LINE通知
                  </label>
                </div>
              );
            })}
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
