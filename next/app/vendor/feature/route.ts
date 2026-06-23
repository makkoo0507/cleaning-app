import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth";
import { setContractorFeature } from "@/lib/features";

// 運営が各業者のオプション加入状況を変更する（運営のみ）。
export async function POST(request: NextRequest) {
  await requirePlatformAdmin();

  const form = await request.formData();
  const contractorId = String(form.get("contractor_id") ?? "").trim();
  const featureKey = String(form.get("feature_key") ?? "").trim();
  // チェックボックス: ON のときのみ "enabled" が送られる
  const enabled = form.get("enabled") != null;

  if (!contractorId || !featureKey) {
    return NextResponse.redirect(new URL("/vendor?error=input", request.url), 303);
  }

  await setContractorFeature(contractorId, featureKey, enabled);
  return NextResponse.redirect(
    new URL("/vendor?feature=ok", request.url),
    303
  );
}
