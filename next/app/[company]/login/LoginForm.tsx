"use client";

import { useActionState } from "react";
import { loginToCompany, type LoginState } from "./actions";
import { Field, TextInput } from "@/components/ui";

const initialState: LoginState = {};

export default function LoginForm({
  slug,
  companyName,
}: {
  slug: string;
  companyName: string;
}) {
  const action = loginToCompany.bind(null, slug);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <p className="text-sm text-zinc-500">民泊清掃管理</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {companyName}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">管理者・社員ログイン</p>
        </div>

        <form action={formAction} className="space-y-4">
          <Field label="メールアドレス" required>
            <TextInput name="email" type="email" autoComplete="email" required />
          </Field>

          <Field label="パスワード" required>
            <TextInput
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </Field>

          {state.error && (
            <p className="text-sm text-red-600" role="alert">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {pending ? "ログイン中…" : "ログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}
