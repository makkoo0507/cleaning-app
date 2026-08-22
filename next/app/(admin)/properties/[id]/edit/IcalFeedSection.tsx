"use client";

import { useActionState, useState, useTransition } from "react";
import type { IcalFeed, IcalFeedType } from "@/lib/database.types";
import { addIcalFeed, deleteIcalFeed, type IcalFormState } from "../../ical-actions";
import { Alert, PendingLabel } from "@/components/ui";

const SITE_CONTROLLER_PRESETS = ["Beds24", "Smoobu", "Hostaway", "AirHost", "その他"];
const OTA_PRESETS = ["Airbnb", "VRBO", "楽天トラベル", "Vacation STAY", "Booking.com", "その他"];

function formatDate(iso: string | null) {
  if (!iso) return "未同期";
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function AddFeedForm({ propertyId }: { propertyId: string }) {
  const [feedType, setFeedType] = useState<IcalFeedType | "">("");
  const [nameValue, setNameValue] = useState("");
  const boundAction = addIcalFeed.bind(null, propertyId);
  const [state, action, pending] = useActionState<IcalFormState, FormData>(boundAction, {});

  const presets = feedType === "site_controller" ? SITE_CONTROLLER_PRESETS : feedType === "ota" ? OTA_PRESETS : [];

  return (
    <form action={action} className="space-y-4 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">iCal フィードを追加</p>

      {/* Step 1: 利用形態 */}
      <div className="space-y-1">
        <label className="text-xs text-zinc-500">利用形態</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="radio"
              name="feed_type"
              value="site_controller"
              checked={feedType === "site_controller"}
              onChange={() => { setFeedType("site_controller"); setNameValue(""); }}
            />
            サイトコントローラー
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="radio"
              name="feed_type"
              value="ota"
              checked={feedType === "ota"}
              onChange={() => { setFeedType("ota"); setNameValue(""); }}
            />
            OTA（Airbnb 等）
          </label>
        </div>
      </div>

      {/* Step 2: 名前・URL */}
      {feedType && (
        <>
          <div className="space-y-1">
            <label className="text-xs text-zinc-500">
              {feedType === "site_controller" ? "サービス名" : "OTA 名"}
            </label>
            <select
              name="name"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="">選択してください</option>
              {presets.map((p) => (
                <option key={p} value={p === "その他" ? "" : p}>
                  {p}
                </option>
              ))}
            </select>
            {nameValue === "" && (
              <input
                type="text"
                name="name"
                placeholder="サービス名を入力"
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs text-zinc-500">iCal URL</label>
            <input
              type="url"
              name="url"
              placeholder="https://..."
              required
              className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>

          {state.error && <Alert variant="error" inline>{state.error}</Alert>}

          <button
            type="submit"
            disabled={pending}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <PendingLabel pending={pending}>{pending ? "追加中…" : "追加"}</PendingLabel>
          </button>
        </>
      )}
    </form>
  );
}

function FeedRow({ feed, propertyId }: { feed: IcalFeed; propertyId: string }) {
  const [syncing, startSync] = useTransition();
  const [syncResult, setSyncResult] = useState<string | null>(null);

  async function handleSync() {
    startSync(async () => {
      const res = await fetch("/api/sync-ical", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_id: propertyId }),
      });
      const data = await res.json();
      setSyncResult(res.ok ? "同期しました" : (data.error ?? "エラー"));
      setTimeout(() => setSyncResult(null), 3000);
    });
  }

  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{feed.name}</span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {feed.feed_type === "site_controller" ? "サイトコントローラー" : "OTA"}
          </span>
          {feed.last_error && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] text-red-600 dark:bg-red-950 dark:text-red-400">
              エラー
            </span>
          )}
        </div>
        <p className="truncate text-xs text-zinc-400">{feed.url}</p>
        <p className="text-xs text-zinc-400">
          最終同期: {formatDate(feed.last_synced_at)}
          {feed.last_error && (
            <span className="ml-2 text-red-500">{feed.last_error}</span>
          )}
        </p>
        {syncResult && (
          <p className="text-xs text-zinc-600 dark:text-zinc-400">{syncResult}</p>
        )}
      </div>

      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          <PendingLabel pending={syncing}>{syncing ? "同期中…" : "今すぐ同期"}</PendingLabel>
        </button>
        <form action={deleteIcalFeed}>
          <input type="hidden" name="id" value={feed.id} />
          <input type="hidden" name="property_id" value={propertyId} />
          <button
            type="submit"
            className="rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
            onClick={(e) => { if (!confirm("このフィードを削除しますか？")) e.preventDefault(); }}
          >
            削除
          </button>
        </form>
      </div>
    </div>
  );
}

interface Props {
  propertyId: string;
  feeds: IcalFeed[];
}

export default function IcalFeedSection({ propertyId, feeds }: Props) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">iCal 連携</h2>
        <p className="mt-1 text-xs text-zinc-500">
          予約情報は最大 1 時間ごとに自動反映されます。OTA の管理画面から iCal URL を取得して登録してください。
        </p>
      </div>

      {feeds.length > 0 && (
        <div className="space-y-2">
          {feeds.map((f) => (
            <FeedRow key={f.id} feed={f} propertyId={propertyId} />
          ))}
        </div>
      )}

      <AddFeedForm propertyId={propertyId} />
    </section>
  );
}
