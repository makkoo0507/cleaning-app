import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { CleanerProfile, User } from "@/lib/database.types";
import { updateCleaner } from "../../actions";
import CleanerForm from "../../CleanerForm";
import { PageHeader } from "@/components/ui";
import LineLinkInfo from "@/components/LineLinkInfo";
import LineTestButton from "@/components/LineTestButton";
import { CreatedBanner } from "@/components/CreatedBanner";

export default async function EditCleanerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const supabase = await createClient();
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .eq("role", "cleaner")
    .single<User>();

  if (!user) notFound();

  const { data: profile } = await supabase
    .from("cleaner_profiles")
    .select("*")
    .eq("user_id", id)
    .maybeSingle<CleanerProfile>();

  const action = updateCleaner.bind(null, id);

  return (
    <div className="space-y-6">
      <PageHeader title="清掃者を編集" />
      <CreatedBanner />
      <div>
        <LineLinkInfo lineUserId={user.line_user_id} />
        {user.line_user_id && <LineTestButton userId={id} />}
      </div>
      <CleanerForm
        action={action}
        defaultValues={{
          name: user.name,
          skills: profile?.skills ?? "",
          note: profile?.note ?? "",
        }}
      />
    </div>
  );
}
