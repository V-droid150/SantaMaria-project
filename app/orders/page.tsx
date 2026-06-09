import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { canAccess, ROLE_LABEL } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/app/AppShell";
import OrdersClient, { type OrderRow } from "@/components/orders/OrdersClient";

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/orders");
  if (!canAccess(session.role, "/orders")) redirect("/dashboard?error=forbidden");

  const orders = await prisma.order.findMany({
    where: { storeId: session.storeId, status: { not: "DRAFT" } },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      orderNumber: true,
      channel: true,
      grandTotal: true,
      status: true,
      paymentStatus: true,
      paymentProofUrl: true,
      createdAt: true,
      customer: { select: { name: true, phone: true } },
    },
  });

  const data: OrderRow[] = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    channel: o.channel,
    total: Number(o.grandTotal),
    status: o.status,
    paymentStatus: o.paymentStatus,
    proof: o.paymentProofUrl,
    createdAt: o.createdAt.toISOString(),
    customer: o.customer?.name ?? "Tamu",
    phone: o.customer?.phone ?? null,
  }));

  return (
    <AppShell userName={session.name} roleLabel={ROLE_LABEL[session.role]} role={session.role}>
      <OrdersClient orders={data} />
    </AppShell>
  );
}
