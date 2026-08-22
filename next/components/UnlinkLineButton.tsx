"use client";

import { useState, useTransition } from "react";
import { unlinkLine } from "@/app/(admin)/actions";
import { Alert } from "@/components/ui";

export default function UnlinkLineButton({
  userId,
  name,
  redirectPath,
}: {
  userId: string;
  name: string;
  redirectPath: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await unlinkLine(userId, redirectPath);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-red-600 underline hover:text-red-800 dark:text-red-400"
      >
        紐付けを解除
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => { if (!pending) setOpen(false); }}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              LINE紐付け解除の確認
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              「{name}」のLINE紐付けを解除しますか？
              解除すると通知が届かなくなり、新しい招待URLの発行が必要になります。
            </p>
            {error && (
              <Alert variant="error" inline className="mt-3">
                {error}
              </Alert>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={pending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {pending ? "解除中…" : "解除する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
