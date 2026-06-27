"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Suspense } from "react";

function Nav({ label }: { label: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const week = Number(searchParams.get("week") ?? "0");

  const go = (offset: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", String(week + offset));
    router.push(`${pathname}?${params.toString()}`);
  };

  const btn = "rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900";

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      <button onClick={() => go(-1)} className={btn}>←</button>
      <button onClick={() => go(1)} className={btn}>→</button>
      {week !== 0 && (
        <button onClick={() => go(-week)} className="text-xs text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-50">
          今週
        </button>
      )}
    </div>
  );
}

export function WeekNav({ label }: { label: string }) {
  return (
    <Suspense fallback={<span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>}>
      <Nav label={label} />
    </Suspense>
  );
}
