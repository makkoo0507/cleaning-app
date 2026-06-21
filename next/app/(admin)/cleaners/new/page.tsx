import { requireContractor } from "@/lib/auth";
import { createCleaner } from "../actions";
import CleanerForm from "../CleanerForm";
import { PageHeader } from "@/components/ui";

export default async function NewCleanerPage() {
  await requireContractor();
  return (
    <div className="space-y-6">
      <PageHeader title="清掃者を登録" />
      <p className="text-sm text-zinc-500">
        登録後、一覧から招待 URL を発行して本人に送付してください。
      </p>
      <CleanerForm action={createCleaner} />
    </div>
  );
}
