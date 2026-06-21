"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import liff from "@line/liff";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/database.types";

interface LiffUser {
  id: string;
  name: string;
  companyId: string;
  role: UserRole;
}

const LiffUserContext = createContext<LiffUser | null>(null);

export function useLiffUser(): LiffUser {
  const ctx = useContext(LiffUserContext);
  if (!ctx) throw new Error("useLiffUser must be used inside LiffAuthGuard");
  return ctx;
}

interface Props {
  liffId: string;
  expectedRole: "cleaner" | "contact";
  children: React.ReactNode;
}

export function LiffAuthGuard({ liffId, expectedRole, children }: Props) {
  const [liffUser, setLiffUser] = useState<LiffUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    // React StrictMode の二重呼び出し対策
    if (initialized.current) return;
    initialized.current = true;

    async function init() {
      await liff.init({ liffId });

      if (!liff.isLoggedIn()) {
        liff.login();
        return;
      }

      const supabase = createClient();

      // 既存セッションの確認
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        const profile = await liff.getProfile();

        const res = await fetch("/api/liff/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lineUserId: profile.userId }),
        });

        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          if (json.error === "user_not_found") {
            setError(
              "このアカウントは登録されていません。担当者から招待URLを受け取ってください。"
            );
          } else {
            setError("認証に失敗しました。");
          }
          return;
        }

        const { tokenHash } = await res.json();
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "magiclink",
        });

        if (otpError) {
          setError("セッションの取得に失敗しました。");
          return;
        }
      }

      const { data: userData } = await supabase
        .from("users")
        .select("id, name, company_id, role")
        .single();

      if (!userData) {
        setError("ユーザー情報の取得に失敗しました。");
        return;
      }

      if (userData.role !== expectedRole) {
        setError("このページへのアクセス権限がありません。");
        return;
      }

      setLiffUser({
        id: userData.id,
        name: userData.name,
        companyId: userData.company_id,
        role: userData.role as UserRole,
      });
    }

    init().catch(() => setError("初期化中にエラーが発生しました。"));
  }, [liffId, expectedRole]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <p className="text-center text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!liffUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <LiffUserContext.Provider value={liffUser}>
      {children}
    </LiffUserContext.Provider>
  );
}
