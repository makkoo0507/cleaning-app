import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Job, Property, User } from "@/lib/database.types";
import { JOB_STATUS_LABEL } from "@/lib/database.types";
import { jstMonthRange } from "@/lib/format";

function csvCell(v: string | number | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 請求・支払い機能が無効なら CSV 出力不可
  const { data: profile } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user.id)
    .maybeSingle<{ company_id: string }>();
  if (profile) {
    const { data: company } = await supabase
      .from("contractor_companies")
      .select("billing_enabled")
      .eq("id", profile.company_id)
      .maybeSingle<{ billing_enabled: boolean }>();
    if (company && company.billing_enabled === false) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  const month = request.nextUrl.searchParams.get("month") ?? undefined;
  const { start, end, value } = jstMonthRange(month);

  const [{ data: jobsData }, { data: propsData }, { data: cleanersData }] =
    await Promise.all([
      supabase
        .from("jobs")
        .select("*")
        .gte("scheduled_date", start)
        .lte("scheduled_date", end)
        .order("scheduled_date", { ascending: true }),
      supabase.from("properties").select("id, name"),
      supabase.from("users").select("id, name").eq("role", "cleaner"),
    ]);

  const jobs = (jobsData as Job[]) ?? [];
  const propMap = new Map(
    ((propsData as Pick<Property, "id" | "name">[]) ?? []).map((p) => [
      p.id,
      p.name,
    ])
  );
  const cleanerMap = new Map(
    ((cleanersData as Pick<User, "id" | "name">[]) ?? []).map((c) => [
      c.id,
      c.name,
    ])
  );

  const header = [
    "清掃日",
    "物件",
    "清掃者",
    "状態",
    "請求額",
    "支払い額",
  ];
  const rows = jobs.map((j) => [
    j.scheduled_date,
    propMap.get(j.property_id) ?? "",
    j.cleaner_id ? cleanerMap.get(j.cleaner_id) ?? "" : "",
    JOB_STATUS_LABEL[j.status],
    j.billing_amount ?? "",
    j.payment_amount ?? "",
  ]);

  const totalBilling = jobs.reduce((s, j) => s + (j.billing_amount ?? 0), 0);
  const totalPayment = jobs.reduce((s, j) => s + (j.payment_amount ?? 0), 0);
  rows.push(["合計", "", "", "", totalBilling, totalPayment]);

  const lines = [header, ...rows].map((r) => r.map(csvCell).join(","));
  // Excel での文字化け防止に BOM を付与
  const csv = "﻿" + lines.join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="billing_${value}.csv"`,
    },
  });
}
