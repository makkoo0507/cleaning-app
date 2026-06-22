"use client";

// LIFF ログインのブートストラップ（未認証時のみ表示）
// LINE SDK でログイン → LINE ID をサーバーに渡してセッション Cookie を発行 → 再描画。
// 以降のデータ取得はすべて Server Component 側で行う（ブラウザは Supabase に触れない）。
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import liff from "@line/liff";

export default function LiffBootstrap({
  liffId,
  expectedRole,
}: {
  liffId: string;
  expectedRole?: "cleaner" | "contact";
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function run() {
      if (!liffId) {
        setError("LIFF の設定がありません。");
        return;
      }
      await liff.init({ liffId });

      if (!liff.isLoggedIn()) {
        // ログイン後は今いる画面へ戻す
        liff.login({ redirectUri: window.location.href });
        return;
      }

      const profile = await liff.getProfile();
      const res = await fetch("/api/liff/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineUserId: profile.userId, role: expectedRole }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(
          json.error === "user_not_found"
            ? "このアカウントは登録されていません。担当者から招待URLを受け取ってください。"
            : "認証に失敗しました。"
        );
        return;
      }

      // セッション Cookie が発行されたので Server Component を再評価
      router.refresh();
    }

    run().catch(() => setError("初期化中にエラーが発生しました。"));
  }, [liffId, router, expectedRole]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      {error ? (
        <p className="text-center text-sm text-red-600">{error}</p>
      ) : (
        <p className="text-sm text-zinc-500">読み込み中...</p>
      )}
    </div>
  );
}
