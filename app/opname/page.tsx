import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { canAccess, ROLE_LABEL } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/app/AppShell";
import OpnameClient, { type OpnameRow } from "@/components/opname/OpnameClient";

export default async function OpnamePage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/opname");
  if (!canAccess(session.role, "/opname")) redirect("/dashboard?error=forbidden");

  const variants = await prisma.productVariant.findMany({
    where: { isActive: true, product: { storeId: session.storeId, type: "PHYSICAL", isActive: true } },
    orderBy: [{ product: { name: "asc" } }, { name: "asc" }],
    select: { id: true, name: true, stock: true, product: { select: { name: true } } },
  });

  const rows: OpnameRow[] = variants.map((v) => ({
    variantId: v.id,
    name: v.product.name + (v.name !== "Default" ? ` · ${v.name}` : ""),
    systemStock: v.stock,
  }));

  return (
    <AppShell userName={session.name} roleLabel={ROLE_LABEL[session.role]} role={session.role}>
      <OpnameClient rows={rows} />
    </AppShell>
  );
}
