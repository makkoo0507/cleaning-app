import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type {
  Property,
  PropertyMember,
  PropertyMemberProfile,
  User,
} from "@/lib/database.types";
import { updateOwner } from "../../actions";
import OwnerForm from "../../OwnerForm";
import { PageHeader } from "@/components/ui";
import LineLinkInfo from "@/components/LineLinkInfo";
import { LIFF_ID } from "@/lib/liff-auth";
import LineTestButton from "@/components/LineTestButton";
import { CreatedBanner } from "@/components/CreatedBanner";

export default async function EditOwnerPage({
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
    .eq("role", "contact")
    .single<User>();

  if (!user) notFound();

  const [{ data: profile }, { data: members }, { data: propsData }] =
    await Promise.all([
      supabase
        .from("property_member_profiles")
        .select("*")
        .eq("user_id", id)
        .maybeSingle<PropertyMemberProfile>(),
      supabase.from("property_members").select("*").eq("user_id", id),
      supabase.from("properties").select("id, name").order("name"),
    ]);

  const properties = (propsData as Pick<Property, "id" | "name">[]) ?? [];
  const action = updateOwner.bind(null, id);

  return (
    <div className="space-y-6">
      <PageHeader title="物件関係者を編集" />
      <CreatedBanner />
      <div>
        <LineLinkInfo lineUserId={user.line_user_id} inviteToken={user.invite_token} liffId={LIFF_ID} />
        {user.line_user_id && <LineTestButton userId={id} />}
      </div>
      <OwnerForm
        action={action}
        properties={properties}
        defaultValues={{
          name: user.name,
          company_name: profile?.company_name ?? "",
          phone: profile?.phone ?? "",
          billing_address: profile?.billing_address ?? "",
          memberships: ((members as PropertyMember[]) ?? []).map((m) => ({
            property_id: m.property_id,
            role: m.role,
            notify: m.notify,
          })),
        }}
      />
    </div>
  );
}
