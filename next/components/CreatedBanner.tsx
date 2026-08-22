"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Alert } from "@/components/ui";

function Banner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const created = searchParams.get("created");

  useEffect(() => {
    if (created) {
      router.replace(pathname, { scroll: false });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!created) return null;

  return <Alert variant="success">登録しました。</Alert>;
}

export function CreatedBanner() {
  return (
    <Suspense>
      <Banner />
    </Suspense>
  );
}
