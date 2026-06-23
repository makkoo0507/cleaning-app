"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, TextInput } from "@/components/ui";

// 会社URLが分からない人向けの入口。slug を入れて /{slug}/login へ。
export default function SlugEntry() {
  const router = useRouter();
  const [slug, setSlug] = useState("");

  function go(e: React.FormEvent) {
    e.preventDefault();
    const s = slug.trim().toLowerCase();
    if (s) router.push(`/${encodeURIComponent(s)}/login`);
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            民泊清掃管理
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            会社のログインURLを入力してください
          </p>
        </div>

        <form onSubmit={go} className="space-y-4">
          <Field label="会社ID（例: acme）" required>
            <TextInput
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="acme"
              autoFocus
              required
            />
          </Field>
          <button
            type="submit"
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            ログインページへ
          </button>
        </form>
        <p className="text-center text-xs text-zinc-500">
          業者IDが不明な場合は、管理者もしくはシステム運営（ベンダー）にお問い合わせください。
        </p>
      </div>
    </div>
  );
}
