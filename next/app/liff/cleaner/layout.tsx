// 清掃者用 Mini App 共通ヘッダー（青系）。役割を色と文言で明示する。
export default function CleanerLiffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 bg-blue-600 px-4 py-3 text-white shadow-sm">
        <p className="text-sm font-semibold">清掃者メニュー</p>
      </header>
      {children}
    </div>
  );
}
