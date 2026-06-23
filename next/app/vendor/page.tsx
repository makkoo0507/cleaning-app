import { requirePlatformAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { listFeatures } from "@/lib/features";
import { Field, TextInput, Select } from "@/components/ui";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  input: "未入力の項目があります。",
  slug_format: "ログインURL（slug）は英小文字・数字・ハイフンのみで入力してください。",
  password_short: "パスワードは8文字以上にしてください。",
  slug_taken: "このログインURL（slug）は既に使われています。",
  email_taken: "このメールアドレスは既に登録されています。",
  auth: "管理者アカウントの作成に失敗しました。",
  company: "会社の作成に失敗しました。",
  user: "管理者プロフィールの作成に失敗しました。",
  target: "対象ユーザーが見つかりません。",
  reset: "パスワードの再設定に失敗しました。",
};

interface ContractRow {
  company_id: string;
  feature_key: string;
  enabled: boolean;
}

interface CompanyRow {
  id: string;
  name: string;
  slug: string | null;
  plan: string;
  created_at: string;
}

interface AdminRow {
  id: string;
  name: string;
  company_id: string;
  vendor_managed: boolean;
}

export default async function VendorPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    created?: string;
    pw_reset?: string;
    feature?: string;
    company_name?: string;
    slug?: string;
    plan?: string;
    admin_name?: string;
    admin_email?: string;
  }>;
}) {
  const admin = await requirePlatformAdmin();
  const {
    error,
    created,
    pw_reset,
    feature,
    company_name: prevCompanyName,
    slug: prevSlug,
    plan: prevPlan,
    admin_name: prevAdminName,
    admin_email: prevAdminEmail,
  } = await searchParams;

  const client = createAdminClient();
  const { data: companies } = await client
    .from("contractor_companies")
    .select("id, name, slug, plan, created_at")
    .order("created_at", { ascending: false })
    .returns<CompanyRow[]>();

  // 各会社の管理者（パスワード再設定の対象）
  // パスワード再設定の対象はベンダーアカウントのみ
  const { data: admins } = await client
    .from("users")
    .select("id, name, company_id, vendor_managed")
    .eq("role", "contractor_admin")
    .eq("vendor_managed", true)
    .not("company_id", "is", null)
    .returns<AdminRow[]>();

  // 管理者のメールアドレス（auth.users から）
  const { data: authList } = await client.auth.admin.listUsers({
    perPage: 1000,
  });
  const emailById = new Map(
    (authList?.users ?? []).map((u) => [u.id, u.email ?? ""])
  );
  const adminsByCompany = new Map<string, AdminRow[]>();
  for (const a of admins ?? []) {
    const arr = adminsByCompany.get(a.company_id) ?? [];
    arr.push(a);
    adminsByCompany.set(a.company_id, arr);
  }

  // オプション（カタログ）と各社の加入状況
  const features = await listFeatures();
  const { data: contracts } = await client
    .from("company_features")
    .select("company_id, feature_key, enabled")
    .returns<ContractRow[]>();
  const contractMap = new Map(
    (contracts ?? []).map((c) => [`${c.company_id}:${c.feature_key}`, c.enabled])
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">民泊清掃管理 ・ 運営管理</p>
          <h1 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            業者アカウント発行
          </h1>
          <p className="mt-1 text-sm text-zinc-500">ログイン中: {admin.name}</p>
        </div>
        <form method="post" action="/vendor/logout">
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            ログアウト
          </button>
        </form>
      </header>

      {created && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          会社を作成しました。ログインURL: <code>/{created}/login</code>
        </div>
      )}
      {pw_reset === "ok" && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          パスワードを再設定しました。新しいパスワードを本人へお伝えください。
        </div>
      )}
      {feature === "ok" && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          オプションの加入状況を更新しました。
        </div>
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {ERRORS[error] ?? "エラーが発生しました。"}
        </div>
      )}

      <section className="rounded-md border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          新規発行
        </h2>
        <form method="post" action="/vendor/create" className="space-y-4">
          <Field label="会社名" required htmlFor="company_name">
            <TextInput
              id="company_name"
              name="company_name"
              defaultValue={prevCompanyName}
              required
            />
          </Field>
          <Field
            label="ログインURL（slug・英小文字/数字/ハイフン）"
            required
            htmlFor="slug"
          >
            <TextInput
              id="slug"
              name="slug"
              placeholder="acme"
              defaultValue={prevSlug}
              required
            />
          </Field>
          <Field label="プラン" htmlFor="plan">
            <Select id="plan" name="plan" defaultValue={prevPlan ?? "free"}>
              <option value="free">free（無料）</option>
              <option value="paid">paid（有料）</option>
            </Select>
          </Field>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          <Field label="管理者名" required htmlFor="admin_name">
            <TextInput
              id="admin_name"
              name="admin_name"
              defaultValue={prevAdminName}
              required
            />
          </Field>
          <Field label="管理者メールアドレス" required htmlFor="admin_email">
            <TextInput
              id="admin_email"
              name="admin_email"
              type="email"
              defaultValue={prevAdminEmail}
              required
            />
          </Field>
          <Field
            label="管理者パスワード（8文字以上）"
            required
            htmlFor="admin_password"
          >
            <TextInput
              id="admin_password"
              name="admin_password"
              type="password"
              required
            />
          </Field>

          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            発行する
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          登録済みの会社（{companies?.length ?? 0}）
        </h2>
        <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-3 py-2 text-left font-medium">会社名</th>
                <th className="px-3 py-2 text-left font-medium">ログインURL</th>
                <th className="px-3 py-2 text-left font-medium">プラン</th>
              </tr>
            </thead>
            <tbody>
              {(companies ?? []).map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-zinc-100 dark:border-zinc-800"
                >
                  <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">
                    {c.name}
                  </td>
                  <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                    {c.slug ? (
                      <a
                        href={`/vendor/switch?slug=${c.slug}`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        /{c.slug}/login
                      </a>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                    {c.plan}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          ベンダーアカウントのパスワード再設定
        </h2>
        <p className="mb-3 text-sm text-zinc-500">
          各会社のベンダー用アカウント（運営が会社管理画面へ入るためのアカウント）の
          パスワードを再設定します。業者管理者のパスワードは、このアカウントで会社に
          ログインし「ユーザー管理」から変更してください。
        </p>
        <div className="space-y-3">
          {(companies ?? []).map((c) => {
            const list = adminsByCompany.get(c.id) ?? [];
            return (
              <div
                key={c.id}
                className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {c.name}
                </p>
                {list.length === 0 && (
                  <p className="mt-1 text-sm text-zinc-500">管理者なし</p>
                )}
                {list.map((a) => (
                  <form
                    key={a.id}
                    method="post"
                    action="/vendor/reset-password"
                    className="mt-2 flex flex-wrap items-center gap-2"
                  >
                    <input type="hidden" name="user_id" value={a.id} />
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {a.name}
                      {a.vendor_managed && (
                        <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                          運営用
                        </span>
                      )}
                      {emailById.get(a.id)
                        ? `（${emailById.get(a.id)}）`
                        : ""}
                    </span>
                    <input
                      type="password"
                      name="password"
                      placeholder="新しいパスワード"
                      autoComplete="new-password"
                      required
                      className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    />
                    <button
                      type="submit"
                      className="rounded-md border border-zinc-300 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    >
                      再設定
                    </button>
                  </form>
                ))}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          オプションの加入状況
        </h2>
        <p className="mb-3 text-sm text-zinc-500">
          各会社のオプション（有料機能含む）の加入を運営側で切り替えます。
        </p>
        <div className="space-y-3">
          {(companies ?? []).map((c) => (
            <div
              key={c.id}
              className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {c.name}
              </p>
              {features.length === 0 && (
                <p className="mt-1 text-sm text-zinc-500">オプションなし</p>
              )}
              {features.map((f) => {
                const enabled = contractMap.get(`${c.id}:${f.key}`) ?? false;
                return (
                  <form
                    key={f.key}
                    method="post"
                    action="/vendor/feature"
                    className="mt-2 flex flex-wrap items-center gap-2"
                  >
                    <input type="hidden" name="company_id" value={c.id} />
                    <input type="hidden" name="feature_key" value={f.key} />
                    <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <input
                        type="checkbox"
                        name="enabled"
                        defaultChecked={enabled}
                      />
                      {f.name}
                      {f.is_paid && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                          有料
                        </span>
                      )}
                    </label>
                    <button
                      type="submit"
                      className="rounded-md border border-zinc-300 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    >
                      保存
                    </button>
                  </form>
                );
              })}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
