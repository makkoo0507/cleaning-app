"use client";

import { useState, useTransition } from "react";
import type { CleaningImage } from "@/lib/database.types";
import { updateImageShare, deleteImage } from "../actions";

export interface ImageWithUrl extends CleaningImage {
  signedUrl: string;
}

interface Props {
  jobId: string;
  initialImages: ImageWithUrl[];
}

export default function PhotoSection({ jobId, initialImages }: Props) {
  const [images, setImages] = useState<ImageWithUrl[]>(initialImages);
  const [modalSrc, setModalSrc] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleShareChange(imageId: string, checked: boolean) {
    setImages((prev) =>
      prev.map((img) => (img.id === imageId ? { ...img, share_with_owner: checked } : img))
    );
    startTransition(async () => {
      await updateImageShare(imageId, checked);
    });
  }

  function handleDelete(imageId: string) {
    if (!confirm("この写真を削除しますか？")) return;
    startTransition(async () => {
      await deleteImage(imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    });
  }

  async function handleZipDownload() {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    await Promise.all(
      images.map(async (img, i) => {
        const res = await fetch(img.signedUrl);
        const blob = await res.blob();
        zip.file(`photo_${String(i + 1).padStart(3, "0")}.jpg`, blob);
      })
    );
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `photos_${jobId.slice(0, 8)}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {images.length === 0 ? (
        <p className="rounded-md border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
          写真はまだありません
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="group relative">
              <button
                type="button"
                onClick={() => setModalSrc(img.signedUrl)}
                className="block w-full"
              >
                <img
                  src={img.signedUrl}
                  alt=""
                  loading="lazy"
                  className="aspect-square w-full rounded-md object-cover"
                />
              </button>
              <label className="mt-1 flex cursor-pointer items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400">
                <input
                  type="checkbox"
                  checked={img.share_with_owner}
                  onChange={(e) => handleShareChange(img.id, e.target.checked)}
                  disabled={isPending}
                  className="rounded border-zinc-300"
                />
                オーナーに共有
              </label>
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                disabled={isPending}
                className="absolute right-1 top-1 hidden rounded bg-red-600 px-1.5 py-0.5 text-xs text-white hover:bg-red-700 group-hover:block disabled:opacity-50"
              >
                削除
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <button
          type="button"
          onClick={handleZipDownload}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          まとめてZIPダウンロード
        </button>
      )}

      {modalSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setModalSrc(null)}
        >
          <img
            src={modalSrc}
            alt=""
            className="max-h-screen max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setModalSrc(null)}
            className="absolute right-4 top-4 rounded-full bg-white/20 px-3 py-1 text-sm text-white hover:bg-white/40"
          >
            閉じる
          </button>
        </div>
      )}
    </div>
  );
}
