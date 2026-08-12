"use client";

// 清掃開始・完了・メモ更新（更新は /api/liff/record 経由）。成功後 router.refresh で再取得。
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { JobStatus } from "@/lib/database.types";
import { compressImage } from "@/lib/compress-image";

interface ImageWithUrl {
  id: string;
  storage_path: string;
  share_with_owner: boolean;
  url: string;
}

export default function CleanerJobActions({
  jobId,
  status,
  initialMemo,
  images,
}: {
  jobId: string;
  status: JobStatus;
  initialMemo?: string | null;
  images: ImageWithUrl[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [memo, setMemo] = useState(initialMemo ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // 写真アップロード
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 写真削除
  const [deleting, setDeleting] = useState<string | null>(null);

  // 原寸表示モーダル
  const [modalUrl, setModalUrl] = useState<string | null>(null);

  async function send(action: "start" | "complete" | "update_memo" | "revert_start" | "revert_complete") {
    setSubmitting(true);
    setError(null);
    setSaved(false);

    const res = await fetch("/api/liff/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, jobId, memo }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      const messages: Record<string, string> = {
        already_started: "既に開始されています。",
        not_in_progress: "清掃が開始されていません。",
        forbidden: "この案件へのアクセス権限がありません。",
        record_not_found: "記録が見つかりません。",
      };
      setError(messages[json.error] ?? "操作に失敗しました。");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    if (action === "update_memo") {
      setSaved(true);
    }
    router.refresh();
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const currentCount = images.length;
    if (currentCount + files.length > 30) {
      setUploadError(
        `写真は最大30枚まで。現在${currentCount}枚・選択${files.length}枚で上限を超えます。`
      );
      e.target.value = "";
      return;
    }

    setUploading(true);
    setUploadError(null);

    for (let i = 0; i < files.length; i++) {
      setUploadProgress(`${i + 1} / ${files.length} 枚をアップロード中...`);

      try {
        const compressed = await compressImage(files[i]);
        const formData = new FormData();
        formData.append("file", compressed);
        formData.append("jobId", jobId);

        const res = await fetch("/api/liff/images", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          if (json.error === "limit_exceeded") {
            setUploadError("30枚の上限に達しました。");
          } else {
            setUploadError("アップロードに失敗しました。");
          }
          break;
        }
      } catch {
        setUploadError("アップロードに失敗しました。");
        break;
      }
    }

    setUploading(false);
    setUploadProgress(null);
    e.target.value = "";
    router.refresh();
  }

  async function handleDelete(imageId: string) {
    setDeleting(imageId);

    const res = await fetch("/api/liff/images", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId }),
    });

    if (!res.ok) {
      setDeleting(null);
      return;
    }

    setDeleting(null);
    router.refresh();
  }

  const memoField = (
    <textarea
      value={memo}
      onChange={(e) => setMemo(e.target.value)}
      placeholder="共有（任意）"
      rows={3}
      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
    />
  );

  return (
    <div className="mt-4 space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {status === "scheduled" && (
        <button
          onClick={() => send("start")}
          disabled={submitting}
          className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? "処理中..." : "清掃開始"}
        </button>
      )}

      {status === "in_progress" && (
        <>
          {memoField}
          <button
            onClick={() => send("complete")}
            disabled={submitting}
            className="w-full rounded-lg bg-green-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "処理中..." : "清掃完了"}
          </button>
          <button
            onClick={() => send("revert_start")}
            disabled={submitting}
            className="w-full rounded-lg border border-zinc-300 py-2 text-sm text-zinc-500 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            開始を取り消す
          </button>
        </>
      )}

      {status === "completed" && (
        <>
          <div className="rounded-lg bg-green-50 p-3 text-center text-sm font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
            清掃完了済み
          </div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            共有（完了後も編集できます）
          </label>
          {memoField}
          <button
            onClick={() => send("update_memo")}
            disabled={submitting}
            className="w-full rounded-lg border border-zinc-300 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            {submitting ? "保存中..." : "共有を保存"}
          </button>
          {saved && (
            <p className="text-center text-xs text-green-600">保存しました</p>
          )}
          <button
            onClick={() => send("revert_complete")}
            disabled={submitting}
            className="w-full rounded-lg border border-zinc-300 py-2 text-sm text-zinc-500 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            完了を取り消す
          </button>
        </>
      )}

      {/* 写真セクション（ステータス問わず常時表示） */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            写真 ({images.length}/30)
          </p>
          <label
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium ${
              uploading || images.length >= 30
                ? "cursor-not-allowed bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading || images.length >= 30}
              onChange={handleUpload}
            />
            {uploading ? "アップロード中..." : "写真を追加"}
          </label>
        </div>

        {uploadProgress && (
          <p className="mt-2 text-xs text-zinc-500">{uploadProgress}</p>
        )}
        {uploadError && (
          <p className="mt-2 text-xs text-red-600">{uploadError}</p>
        )}

        {images.length > 0 ? (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {images.map((img) => (
              <div key={img.id} className="relative">
                <img
                  src={img.url}
                  alt=""
                  loading="lazy"
                  onClick={() => setModalUrl(img.url)}
                  className="h-24 w-full cursor-pointer rounded-lg object-cover"
                />
                {img.share_with_owner ? (
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                    共有済
                  </span>
                ) : (
                  <button
                    onClick={() => handleDelete(img.id)}
                    disabled={deleting === img.id}
                    className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white disabled:opacity-50"
                  >
                    {deleting === img.id ? "..." : "削除"}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-center text-xs text-zinc-400">
            写真はまだありません
          </p>
        )}
      </div>

      {/* 原寸表示モーダル */}
      {modalUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setModalUrl(null)}
        >
          <img
            src={modalUrl}
            alt=""
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )}
    </div>
  );
}
