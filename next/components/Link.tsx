"use client";

import NextLink, { useLinkStatus } from "next/link";
import type { ComponentProps } from "react";
import { SpinnerIcon } from "@/components/ui";

// Link の子でのみ有効なフック。クリック直後、遷移先の描画完了を待たずに反応する。
function PendingLabel({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus();
  return (
    <span className="inline-flex items-center gap-2">
      {children}
      {pending && <SpinnerIcon className="h-3.5 w-3.5" />}
    </span>
  );
}

// next/link のドロップイン置き換え。クリック直後にスピナーを自動表示する。
// アプリ内のページ遷移は必ずこの Link を使うことで、実装漏れによる表示の揺れを防ぐ。
export default function Link({ children, ...props }: ComponentProps<typeof NextLink>) {
  return (
    <NextLink {...props}>
      <PendingLabel>{children}</PendingLabel>
    </NextLink>
  );
}
