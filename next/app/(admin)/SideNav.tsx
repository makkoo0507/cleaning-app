"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { logout } from "./actions";

const TOP_NAV = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/schedules", label: "スケジュール" },
  { href: "/records", label: "清掃記録" },
];

const MASTER_NAV = [
  { href: "/properties", label: "物件" },
  { href: "/owners", label: "オーナー" },
  { href: "/cleaners", label: "清掃者" },
];

const BILLING_NAV = { href: "/billing", label: "請求・支払い" };

const SETTINGS_NAV = [
  { href: "/settings", label: "LINE連携" },
  { href: "/settings/reminder", label: "通知設定" },
  { href: "/settings/options", label: "オプション" },
  { href: "/staff", label: "ユーザー管理" },
];

interface Props {
  contractorName: string;
  admin: boolean;
  billingEnabled: boolean;
  userName: string;
}

export default function SideNav({ contractorName, admin, billingEnabled, userName }: Props) {
  const rawPathname = usePathname();
  // SSR とクライアントの不一致を防ぐため、アクティブ状態はクライアント側でのみ反映
  const [pathname, setPathname] = useState("");
  useEffect(() => { setPathname(rawPathname); }, [rawPathname]);

  const isOnSettings = pathname.startsWith("/settings") || pathname.startsWith("/staff");
  const isOnMaster = MASTER_NAV.some((item) => pathname.startsWith(item.href));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [masterOpen, setMasterOpen] = useState(false);

  useEffect(() => {
    setSettingsOpen(isOnSettings);
    setMasterOpen(isOnMaster);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const linkClass = "block rounded-md px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900";
  const activeLinkClass = "block rounded-md px-3 py-2 text-sm font-medium text-zinc-900 bg-zinc-100 dark:text-zinc-50 dark:bg-zinc-800";

  return (
    <aside className="flex w-56 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="px-5 py-5">
        <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {contractorName}
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {TOP_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href ? activeLinkClass : linkClass}
          >
            {item.label}
          </Link>
        ))}

        <Link
          href={BILLING_NAV.href}
          className={
            !billingEnabled
              ? "flex items-center justify-between rounded-md px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-900"
              : `${pathname === BILLING_NAV.href ? activeLinkClass : linkClass} block`
          }
        >
          {!billingEnabled ? (
            <>
              <span>🔒 {BILLING_NAV.label}</span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                オプション
              </span>
            </>
          ) : (
            BILLING_NAV.label
          )}
        </Link>

        {/* 基本情報アコーディオン */}
        <div>
          <button
            type="button"
            onClick={() => setMasterOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <span>基本情報</span>
            <svg
              className={`h-4 w-4 transition-transform ${masterOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {masterOpen && (
            <div className="ml-3 mt-1 space-y-1 border-l border-zinc-200 pl-3 dark:border-zinc-700">
              {MASTER_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={pathname.startsWith(item.href) ? activeLinkClass : linkClass}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {admin && (
          <>
            {/* 設定アコーディオン */}
            <div>
              <button
                type="button"
                onClick={() => setSettingsOpen((o) => !o)}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                <span>設定</span>
                <svg
                  className={`h-4 w-4 transition-transform ${settingsOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {settingsOpen && (
                <div className="ml-3 mt-1 space-y-1 border-l border-zinc-200 pl-3 dark:border-zinc-700">
                  {SETTINGS_NAV.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={pathname === item.href ? activeLinkClass : linkClass}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </nav>

      <div className="px-3 pb-2">
        <a
          href="/manual"
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          マニュアル ↗
        </a>
      </div>

      <div className="border-t border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {userName}
        </p>
        <p className="text-xs text-zinc-500">{admin ? "管理者" : "社員"}</p>
        <form action={logout} className="mt-3">
          <button
            type="submit"
            className="text-xs text-zinc-500 underline hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            ログアウト
          </button>
        </form>
      </div>
    </aside>
  );
}
