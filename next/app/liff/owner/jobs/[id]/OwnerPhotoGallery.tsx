"use client";

import { useState } from "react";

export interface PhotoItem {
  id: string;
  url: string;
  filename: string;
}

async function downloadFile(url: string, filename: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function OwnerPhotoGallery({ photos }: { photos: PhotoItem[] }) {
  const [selected, setSelected] = useState<PhotoItem | null>(null);
  const [zipping, setZipping] = useState(false);

  const handleZipDownload = async () => {
    setZipping(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      await Promise.all(
        photos.map(async (photo) => {
          const res = await fetch(photo.url);
          const blob = await res.blob();
          zip.file(photo.filename, blob);
        })
      );
      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "photos.zip";
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setZipping(false);
    }
  };

  if (photos.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          写真（{photos.length}枚）
        </p>
        <button
          onClick={handleZipDownload}
          disabled={zipping}
          className="text-xs text-blue-600 underline disabled:opacity-50 dark:text-blue-400"
        >
          {zipping ? "作成中…" : "まとめてダウンロード"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => setSelected(photo)}
            className="aspect-square overflow-hidden rounded"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selected.url}
                alt=""
                className="max-h-[75vh] max-w-full object-contain"
              />
            </div>
            <div className="flex gap-2 bg-zinc-900 p-4">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 rounded-lg bg-zinc-700 py-3 text-sm text-white"
              >
                閉じる
              </button>
              <button
                onClick={() => downloadFile(selected.url, selected.filename)}
                className="flex-1 rounded-lg bg-blue-600 py-3 text-sm text-white"
              >
                ダウンロード
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
