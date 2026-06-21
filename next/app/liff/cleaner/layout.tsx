import { LiffAuthGuard } from "@/app/liff/_components/LiffAuthGuard";

export default function CleanerLiffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LiffAuthGuard
      liffId={process.env.NEXT_PUBLIC_LIFF_ID_CLEANER!}
      expectedRole="cleaner"
    >
      {children}
    </LiffAuthGuard>
  );
}
