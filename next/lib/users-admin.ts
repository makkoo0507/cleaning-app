// ユーザー作成ヘルパー（サーバー専用、service role 使用）
//
// users.id は auth.users(id) を参照する FK のため、清掃者・物件関係者のように
// まだログインしていないユーザーでも、先に auth ユーザーを作成する必要がある。
//
// 清掃者/関係者: LINE 紐付け前提なのでメールはダミー、パスワードなし。
//   発行した invite_token を使い、後日 LIFF で line_user_id を紐付ける想定（Phase 3）。
// 社員: 実在のメール＋パスワードで作成する。
import { createAdminClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/database.types";

interface CreateUserArgs {
  contractorId: string;
  role: UserRole;
  name: string;
  // 業者ユーザー（管理者・閲覧者）の場合のみ
  email?: string;
  password?: string;
}

interface CreateUserResult {
  userId?: string;
  inviteToken?: string;
  error?: string;
}

export async function createManagedUser({
  contractorId,
  role,
  name,
  email,
  password,
}: CreateUserArgs): Promise<CreateUserResult> {
  const admin = createAdminClient();

  // LINE 紐付け系（cleaner / contact）はダミーメールで auth ユーザーを作る
  const isLineUser = role === "cleaner" || role === "contact";
  const inviteToken = isLineUser ? crypto.randomUUID() : undefined;

  const authEmail =
    email ?? `${role}.${crypto.randomUUID()}@line.invalid`;

  const { data: authData, error: authError } = await admin.auth.admin.createUser(
    {
      email: authEmail,
      password: password, // undefined 可
      email_confirm: true,
      user_metadata: { name },
    }
  );

  if (authError || !authData.user) {
    if (authError?.message?.toLowerCase().includes("already")) {
      return { error: "このメールアドレスは既に登録されています。" };
    }
    return { error: "ユーザーの作成に失敗しました。" };
  }

  const userId = authData.user.id;

  const { error: insertError } = await admin.from("users").insert({
    id: userId,
    contractor_id: contractorId,
    role,
    name,
    invite_token: inviteToken ?? null,
  });

  if (insertError) {
    // 後始末: auth ユーザーを削除
    await admin.auth.admin.deleteUser(userId);
    return { error: "ユーザー情報の保存に失敗しました。" };
  }

  return { userId, inviteToken };
}

// 管理対象ユーザーの削除（auth ユーザーごと削除 → users は cascade）
export async function deleteManagedUser(userId: string) {
  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(userId);
}

// 清掃者数の上限チェック
export async function countCleaners(contractorId: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("contractor_id", contractorId)
    .eq("role", "cleaner");
  return count ?? 0;
}
