import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import PosTerminal, { type PosProduct } from "@/components/pos/PosTerminal";

export default async function PosPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/pos");
  if (!canAccess(session.role, "/pos")) redirect("/dashboard?error=forbidden");

  // Ambil produk aktif beserta varian aktif. Decimal dikonversi ke number
  // agar bisa dilempar ke Client Component (Decimal tidak serializable).
  const products = await prisma.product.findMany({
    where: { storeId: session.storeId, isActive: true },
    include: {
      category: { select: { name: true } },
      variants: { where: { isActive: true }, orderBy: { name: "asc" } },
    },
    orderBy: { name: "asc" },
  });

  const data: PosProduct[] = products.flatMap((p) =>
    p.variants.map((v) => ({
      variantId: v.id,
      productName: p.name,
      variantName: v.name,
      category: p.category?.name ?? "Lainnya",
      type: p.type,
      price: Number(v.price),
      stock: v.stock,
      image: p.imageUrl,
    }))
  );

  return <PosTerminal products={data} cashierName={session.name} />;
}
