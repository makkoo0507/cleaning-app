import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { ContractorMemberProfile, User } from "@/lib/database.types";
import { updateStaff } from "../../actions";
import StaffForm from "../../StaffForm";
import { PageHeader } from "@/components/ui";

export default async function EditStaffPage({
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
    .in("role", ["contractor_admin", "contractor_viewer"])
    .single<User>();

  if (!user) notFound();

  const { data: profile } = await supabase
    .from("contractor_member_profiles")
    .select("*")
    .eq("user_id", id)
    .maybeSingle<ContractorMemberProfile>();

  const adminClient = createAdminClient();
  const { data: authUser } = await adminClient.auth.admin.getUserById(id);

  const action = updateStaff.bind(null, id);

  return (
    <div className="space-y-6">
      <PageHeader title="ユーザーを編集" />
      <StaffForm
        action={action}
        isEdit
        defaultValues={{
          name: user.name,
          email: authUser?.user?.email ?? "",
          role: user.role,
          department: profile?.department ?? "",
          employee_code: profile?.employee_code ?? "",
        }}
      />
    </div>
  );
}
