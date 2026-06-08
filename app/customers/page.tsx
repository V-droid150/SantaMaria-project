import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { canAccess, ROLE_LABEL } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/app/AppShell";
import CustomersClient, { type CustomerRow } from "@/components/customers/CustomersClient";

export default async function CustomersPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/customers");
  if (!canAccess(session.role, "/customers")) redirect("/dashboard?error=forbidden");

  const [customers, spent] = await Promise.all([
    prisma.customer.findMany({
      where: { storeId: session.storeId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { orders: true } } },
    }),
    prisma.order.groupBy({
      by: ["customerId"],
      where: { storeId: session.storeId, paymentStatus: "PAID", customerId: { not: null } },
      _sum: { grandTotal: true },
    }),
  ]);

  const spentMap = new Map(spent.map((s) => [s.customerId, Number(s._sum.grandTotal ?? 0)]));

  const data: CustomerRow[] = customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    address: c.address,
    points: c.points,
    orderCount: c._count.orders,
    totalSpent: spentMap.get(c.id) ?? 0,
  }));

  return (
    <AppShell userName={session.name} roleLabel={ROLE_LABEL[session.role]} role={session.role}>
      <CustomersClient customers={data} />
    </AppShell>
  );
}
