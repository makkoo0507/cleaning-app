"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

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

  return (
    <p className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
      登録しました。
    </p>
  );
}

export function CreatedBanner() {
  return (
    <Suspense>
      <Banner />
    </Suspense>
  );
}
