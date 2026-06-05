import { redirect } from "next/navigation";
import Dashboard from "@/components/Dashboard";
import { getSession } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/rbac";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/dashboard");

  return <Dashboard userName={session.name} roleLabel={ROLE_LABEL[session.role]} />;
}
