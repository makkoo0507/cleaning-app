import { Field, TextInput } from "@/components/ui";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  input: "メールアドレスとパスワードを入力してください。",
  auth: "ログインに失敗しました。入力内容をご確認ください。",
  forbidden: "このアカウントには運営権限がありません。",
};

export default async function VendorLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <p className="text-sm text-zinc-500">民泊清掃管理</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            運営管理
          </h1>
          <p className="mt-2 text-sm text-zinc-500">ベンダー運営ログイン</p>
        </div>

        <form method="post" action="/vendor/login/submit" className="space-y-4">
          <Field label="メールアドレス" required htmlFor="email">
            <TextInput
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
            />
          </Field>

          <Field label="パスワード" required htmlFor="password">
            <TextInput
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </Field>

          {errorMessage && (
            <p className="text-sm text-red-600" role="alert">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
}
