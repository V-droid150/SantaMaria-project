import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/rbac";
import AppShell from "@/components/app/AppShell";
import FaqClient from "@/components/help/FaqClient";

export default async function HelpPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/help");

  return (
    <AppShell userName={session.name} roleLabel={ROLE_LABEL[session.role]}>
      <FaqClient />
    </AppShell>
  );
}
