"use client";

import { useState } from "react";

// 招待 URL のコピーUI。LINE 紐付け(Phase3)用の token を渡す。
export default function InviteLink({ token }: { token: string | null }) {
  const [copied, setCopied] = useState(false);

  if (!token) {
    return <span className="text-xs text-green-600">紐付け済み</span>;
  }

  const path = `/liff/invite?token=${token}`;

  async function copy() {
    const url =
      typeof window !== "undefined" ? window.location.origin + path : path;
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
      className="text-xs text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      title={path}
    >
      {copied ? "コピーしました" : "招待URLをコピー"}
    </button>
  );
}
