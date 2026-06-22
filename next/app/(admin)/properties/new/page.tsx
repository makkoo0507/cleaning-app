import { requireAdmin } from "@/lib/auth";
import { createProperty } from "../actions";
import PropertyForm from "../PropertyForm";
import { PageHeader } from "@/components/ui";

export default async function NewPropertyPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <PageHeader title="物件を登録" />
      <PropertyForm action={createProperty} />
    </div>
  );
}
