import { requireAdmin } from "@/lib/auth";
import { createStaff } from "../actions";
import StaffForm from "../StaffForm";
import { PageHeader } from "@/components/ui";

export default async function NewStaffPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <PageHeader title="社員を登録" />
      <StaffForm action={createStaff} />
    </div>
  );
}
