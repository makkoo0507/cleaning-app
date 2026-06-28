"use client";

import { useState } from "react";

// 招待 URL のコピーUI。
// LIFF はネイティブ起動（liff.line.me 形式）でないとログインが正しく戻らないため、
// 招待リンクは https://liff.line.me/{liffId}/invite?token=... 形式で発行する。
export default function InviteLink({
  token,
  liffId,
}: {
  token: string | null;
  liffId?: string;
}) {
  const [copied, setCopied] = useState(false);

  if (!token) {
    return <span className="text-xs text-green-600">紐付け済み</span>;
  }

  const url = liffId
    ? `https://liff.line.me/${liffId}/invite?token=${token}`
    : // liffId 未設定（環境変数未設定）時のフォールバック
      `/liff/invite?token=${token}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // クリップボード不可環境は無視
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="text-xs text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
      title={url}
    >
      {copied ? "コピーしました" : "招待URLをコピー"}
    </button>
  );
}
