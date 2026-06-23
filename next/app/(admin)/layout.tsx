import { requireContractor, isAdmin } from "@/lib/auth";
import { getContractorFlags, getContractorName } from "@/lib/contractor";
import SideNav from "./SideNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireContractor();
  const admin = isAdmin(user);
  const [{ billingEnabled }, companyName] = await Promise.all([
    getContractorFlags(user.contractorId),
    getContractorName(user.contractorId),
  ]);

  return (
    <div className="flex min-h-screen flex-1 bg-zinc-50 dark:bg-black">
      <SideNav
        companyName={companyName}
        admin={admin}
        billingEnabled={billingEnabled}
        userName={user.profile.name}
      />
      <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
    </div>
  );
}
