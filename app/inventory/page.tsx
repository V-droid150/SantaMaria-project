import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { canAccess, ROLE_LABEL } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/app/AppShell";
import InventoryClient, { type InvProduct } from "@/components/inventory/InventoryClient";

export default async function InventoryPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/inventory");
  if (!canAccess(session.role, "/inventory")) redirect("/dashboard?error=forbidden");

  const products = await prisma.product.findMany({
    where: { storeId: session.storeId, isActive: true },
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true } },
      variants: { where: { isActive: true }, orderBy: { name: "asc" } },
    },
  });

  const categories = await prisma.category.findMany({
    where: { storeId: session.storeId },
    select: { name: true },
    orderBy: { name: "asc" },
  });

  const data: InvProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    type: p.type,
    category: p.category?.name ?? null,
    variants: p.variants.map((v) => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      price: Number(v.price),
      costPrice: Number(v.costPrice),
      stock: v.stock,
      reorderPoint: v.reorderPoint,
    })),
  }));

  return (
    <AppShell userName={session.name} roleLabel={ROLE_LABEL[session.role]}>
      <InventoryClient products={data} categories={categories.map((c) => c.name)} />
    </AppShell>
  );
}
