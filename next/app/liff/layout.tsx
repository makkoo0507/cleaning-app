import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "民泊清掃管理",
};

export default function LiffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">{children}</div>
  );
}
