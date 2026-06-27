"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { PropertyFormState } from "./actions";
import type { Property } from "@/lib/database.types";
import { Field, TextInput, Textarea } from "@/components/ui";

type Action = (
  prev: PropertyFormState,
  formData: FormData
) => Promise<PropertyFormState>;

export default function PropertyForm({
  action,
  property,
}: {
  action: Action;
  property?: Property;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <Field label="物件名" required>
        <TextInput name="name" type="text" required defaultValue={property?.name ?? ""} />
      </Field>

      <Field label="住所" required>
        <TextInput
          name="address"
          type="text"
          required
          defaultValue={property?.address ?? ""}
        />
      </Field>

      <Field label="特記事項" hint="鍵の場所・注意事項など">
        <Textarea name="notes" rows={4} defaultValue={property?.notes ?? ""} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="デフォルト請求額" hint="案件作成時に自動セット">
          <TextInput
            name="default_billing_amount"
            type="number"
            min="0"
            step="1"
            defaultValue={property?.default_billing_amount ?? ""}
          />
        </Field>
        <Field label="デフォルト支払い額" hint="案件作成時に自動セット">
          <TextInput
            name="default_payment_amount"
            type="number"
            min="0"
            step="1"
            defaultValue={property?.default_payment_amount ?? ""}
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
          href="/properties"
          className="text-sm text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          キャンセル
        </Link>
      </div>
    </form>
  );
}
