"use client";

import { useState, useTransition } from "react";

export function DeleteButton({
  action,
  id,
  name,
  className = "text-red-600 underline hover:text-red-800",
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  name: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    const formData = new FormData();
    formData.append("id", id);
    startTransition(async () => {
      await action(formData);
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        削除
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
              削除の確認
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              「{name}」を削除しますか？この操作は取り消せません。
            </p>
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
                {pending ? "削除中…" : "削除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
