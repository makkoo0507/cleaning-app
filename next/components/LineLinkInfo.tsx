// LINE 紐付け状態と line_user_id の読み取り専用表示（管理者・社員のみが見る編集画面で使用）
// line_user_id は個人識別子のため一覧では出さず、編集画面でのみ確認できるようにする。
import CopyButton from "@/components/CopyButton";
import InviteLink from "@/components/InviteLink";
import UnlinkLineButton from "@/components/UnlinkLineButton";

export default function LineLinkInfo({
  userId,
  userName,
  redirectPath,
  lineUserId,
  inviteToken,
  liffId,
  slug,
}: {
  userId: string;
  userName: string;
  redirectPath: string;
  lineUserId: string | null;
  inviteToken?: string | null;
  liffId?: string | null;
  slug: string;
}) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="mb-1 font-medium text-zinc-700 dark:text-zinc-300">
        LINE 紐付け
      </p>
      {lineUserId ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-green-600">紐付け済み</span>
          <code className="rounded bg-white px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
            {lineUserId}
          </code>
          <CopyButton text={lineUserId} />
          <UnlinkLineButton userId={userId} name={userName} redirectPath={redirectPath} />
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-zinc-500">未紐付け</span>
          {inviteToken && <InviteLink token={inviteToken} liffId={liffId} slug={slug} />}
        </div>
      )}
      <p className="mt-1 text-xs text-zinc-400">
        ※ LINE ユーザー ID。通知送信・外部連携の確認用。
      </p>
    </div>
  );
}
