import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { canAccess, ROLE_LABEL } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/app/AppShell";
import StaffClient, { type StaffRow } from "@/components/staff/StaffClient";

export default async function StaffPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/staff");
  if (!canAccess(session.role, "/staff")) redirect("/dashboard?error=forbidden");

  const users = await prisma.user.findMany({
    where: { storeId: session.storeId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  const data: StaffRow[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    isSelf: u.id === session.userId,
  }));

  return (
    <AppShell userName={session.name} roleLabel={ROLE_LABEL[session.role]} role={session.role}>
      <StaffClient staff={data} />
    </AppShell>
  );
}
