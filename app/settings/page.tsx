import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { canAccess, ROLE_LABEL } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/app/AppShell";
import SettingsClient, { type StoreSettings } from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/settings");
  if (!canAccess(session.role, "/settings")) redirect("/dashboard?error=forbidden");

  const store = await prisma.store.findUnique({ where: { id: session.storeId } });
  if (!store) redirect("/dashboard");

  const data: StoreSettings = {
    name: store.name,
    address: store.address ?? "",
    phone: store.phone ?? "",
    email: store.email ?? "",
    taxRate: Number(store.taxRate),
    category: store.category ?? "",
    businessType: store.businessType ?? "",
  };

  return (
    <AppShell userName={session.name} roleLabel={ROLE_LABEL[session.role]}>
      <SettingsClient initial={data} />
    </AppShell>
  );
}
