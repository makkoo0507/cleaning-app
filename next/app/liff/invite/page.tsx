"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import liff from "@line/liff";

type State = "loading" | "done" | "error";

function InviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<State>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const called = useRef(false);

  useEffect(() => {
    if (called.current || !token) return;
    called.current = true;

    async function link() {
      // 招待トークンからロールを確認
      const roleRes = await fetch(
        `/api/liff/invite?token=${encodeURIComponent(token)}`
      );
      if (!roleRes.ok) {
        setErrorMsg("招待URLが無効か、すでに使用済みです。");
        setState("error");
        return;
      }
      const { role } = await roleRes.json();

      // ロールに応じた LIFF ID で初期化
      const liffId =
        role === "contact"
          ? process.env.NEXT_PUBLIC_LIFF_ID_OWNER!
          : process.env.NEXT_PUBLIC_LIFF_ID_CLEANER!;

      await liff.init({ liffId });
      if (!liff.isLoggedIn()) {
        // LIFF はログイン後エンドポイント(/liff)にしか戻れないため、
        // トークンをクエリで渡し、/liff 側から招待ページへ転送させる。
        const origin = window.location.origin;
        liff.login({
          redirectUri: `${origin}/liff?invite=${encodeURIComponent(token)}`,
        });
        return;
      }

      const profile = await liff.getProfile();

      // LINE user ID を紐付け
      const linkRes = await fetch("/api/liff/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteToken: token,
          lineUserId: profile.userId,
        }),
      });

      if (!linkRes.ok) {
        setErrorMsg("招待URLが無効か、すでに使用済みです。");
        setState("error");
        return;
      }

      setState("done");
    }

    link().catch(() => {
      setErrorMsg("エラーが発生しました。再度お試しください。");
      setState("error");
    });
  }, [token]);

  if (!token) {
    return (
      <p className="text-center text-sm text-red-600">
        招待URLが正しくありません。
      </p>
    );
  }

  if (state === "loading") {
    return <p className="text-sm text-zinc-500">処理中...</p>;
  }

  if (state === "error") {
    return <p className="text-center text-sm text-red-600">{errorMsg}</p>;
  }

  return (
    <div className="text-center">
      <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        LINEアカウントの連携が完了しました
      </p>
      <p className="mt-2 text-sm text-zinc-500">
        担当案件の通知がこのLINEアカウントに届くようになります。
      </p>
    </div>
  );
}

export default function InvitePage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <Suspense
        fallback={<p className="text-sm text-zinc-500">読み込み中...</p>}
      >
        <InviteContent />
      </Suspense>
    </div>
  );
}
