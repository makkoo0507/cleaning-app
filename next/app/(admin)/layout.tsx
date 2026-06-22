import Link from "next/link";
import { requireContractor, isAdmin } from "@/lib/auth";
import { logout } from "./actions";

const NAV = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/schedules", label: "スケジュール" },
  { href: "/properties", label: "物件管理" },
  { href: "/cleaners", label: "清掃者管理" },
  { href: "/owners", label: "オーナー管理" },
  { href: "/staff", label: "社員管理", adminOnly: true },
  { href: "/records", label: "清掃記録" },
  { href: "/billing", label: "請求・支払い" },
  { href: "/settings", label: "設定（LINE連携）", adminOnly: true },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireContractor();
  const admin = isAdmin(user);

  return (
    <div className="flex min-h-screen flex-1 bg-zinc-50 dark:bg-black">
      <aside className="flex w-56 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="px-5 py-5">
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            民泊清掃管理
          </p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.filter((item) => !item.adminOnly || admin).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {user.profile.name}
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

      <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
    </div>
  );
}
