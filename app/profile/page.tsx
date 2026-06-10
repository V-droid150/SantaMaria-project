import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/app/AppShell";
import ProfileClient from "@/components/profile/ProfileClient";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/profile");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true, image: true, role: true, passwordHash: true },
  });
  if (!user) redirect("/login");

  return (
    <AppShell userName={session.name} roleLabel={ROLE_LABEL[session.role]} role={session.role}>
      <ProfileClient
        name={user.name}
        email={user.email}
        image={user.image}
        roleLabel={ROLE_LABEL[user.role]}
        hasPassword={user.passwordHash !== null}
      />
    </AppShell>
  );
}
