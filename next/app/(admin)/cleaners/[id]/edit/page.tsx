import { notFound } from "next/navigation";
import { requireContractor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { CleanerProfile, User } from "@/lib/database.types";
import { updateCleaner } from "../../actions";
import CleanerForm from "../../CleanerForm";
import { PageHeader } from "@/components/ui";
import LineLinkInfo from "@/components/LineLinkInfo";

export default async function EditCleanerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireContractor();
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
      <LineLinkInfo lineUserId={user.line_user_id} />
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
