import { LiffAuthGuard } from "@/app/liff/_components/LiffAuthGuard";

export default function OwnerLiffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LiffAuthGuard
      liffId={process.env.NEXT_PUBLIC_LIFF_ID_OWNER!}
      expectedRole="contact"
    >
      {children}
    </LiffAuthGuard>
  );
}
