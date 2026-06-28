"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function RequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("property_id") ?? "";
  const propertyName = searchParams.get("property_name") ?? "物件";
  const defaultTime = searchParams.get("default_time") ?? "";
  const defaultBilling = searchParams.get("default_billing") ?? "";

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const [date, setDate] = useState(todayStr);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/liff/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, requestedDate: date, note }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "送信に失敗しました。");
      } else {
        setDone(true);
      }
    } catch {
      setError("送信に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">依頼を送信しました</p>
        <p className="mt-2 text-sm text-zinc-500">管理者が確認後、スケジュールに登録されます。</p>
        <button
          onClick={() => router.push("/liff/owner/schedules")}
          className="mt-6 rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300"
        >
          戻る
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-sm text-zinc-500 underline">← 戻る</button>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">清掃を依頼する</h1>
      </div>

      <div className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="font-medium text-zinc-700 dark:text-zinc-300">{propertyName}</p>
        {defaultTime && <p className="mt-1 text-zinc-500">通常開始時刻: {defaultTime}</p>}
        {defaultBilling && <p className="text-zinc-500">清掃料金: {Number(defaultBilling).toLocaleString()}円</p>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            希望日 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            min={todayStr}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            メモ（時間変更・特記事項など）
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="例：14時以降でお願いします"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !date}
          className="w-full rounded-md bg-zinc-900 py-3 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {submitting ? "送信中…" : "依頼を送信する"}
        </button>
      </form>
    </div>
  );
}

export default function RequestPage() {
  return (
    <Suspense>
      <RequestForm />
    </Suspense>
  );
}
