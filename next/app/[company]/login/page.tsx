import { notFound } from "next/navigation";
import { getCompanyBySlug } from "@/lib/company";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function CompanyLoginPage({
  params,
}: {
  params: Promise<{ company: string }>;
}) {
  const { company: slug } = await params;
  const company = await getCompanyBySlug(slug);

  if (!company) notFound();

  return <LoginForm slug={slug} companyName={company.name} />;
}
