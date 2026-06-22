"use client";

// LIFF テスト用ログアウト: Supabase セッション Cookie と LINE ログインをクリアする。
import { useEffect, useRef, useState } from "react";
import liff from "@line/liff";

const LIFF_IDS = [process.env.NEXT_PUBLIC_LIFF_ID].filter(Boolean) as string[];

export default function LiffLogoutPage() {
  const [done, setDone] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function run() {
      // 1) アプリのセッション Cookie をクリア
      await fetch("/api/liff/logout").catch(() => {});

      // 2) LINE ログインをクリア
      for (const id of LIFF_IDS) {
        try {
          await liff.init({ liffId: id });
          if (liff.isLoggedIn()) liff.logout();
        } catch {
          // 初期化失敗は無視
        }
      }
      setDone(true);
    }

    run().catch(() => setDone(true));
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        {done ? (
          <>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              ログアウトしました
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              招待URLから再度ログインをお試しください。
            </p>
          </>
        ) : (
          <p className="text-sm text-zinc-500">ログアウト処理中...</p>
        )}
      </div>
    </div>
  );
}
