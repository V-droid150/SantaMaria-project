import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { canAccess, ROLE_LABEL } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/app/AppShell";
import DebtsClient, { type DebtRow } from "@/components/debts/DebtsClient";

export default async function DebtsPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/debts");
  if (!canAccess(session.role, "/debts")) redirect("/dashboard?error=forbidden");

  const debts = await prisma.debt.findMany({
    where: { storeId: session.storeId },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      customer: { select: { name: true } },
      supplier: { select: { name: true } },
    },
  });

  const rows: DebtRow[] = debts.map((d) => ({
    id: d.id,
    type: d.type,
    status: d.status,
    amount: Number(d.amount),
    paidAmount: Number(d.paidAmount),
    partyName: (d.type === "RECEIVABLE" ? d.customer?.name : d.supplier?.name) ?? "—",
    dueDate: d.dueDate ? d.dueDate.toISOString() : null,
    note: d.note,
    fromOrder: d.orderId !== null,
  }));

  // Ringkasan: sisa tagihan yang belum lunas.
  const outstanding = (type: "RECEIVABLE" | "PAYABLE") =>
    rows
      .filter((r) => r.type === type && r.status !== "PAID")
      .reduce((s, r) => s + (r.amount - r.paidAmount), 0);

  const [customers, suppliers] = await Promise.all([
    prisma.customer.findMany({ where: { storeId: session.storeId }, select: { name: true }, orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ where: { storeId: session.storeId }, select: { name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <AppShell userName={session.name} roleLabel={ROLE_LABEL[session.role]} role={session.role}>
      <DebtsClient
        rows={rows}
        totalReceivable={outstanding("RECEIVABLE")}
        totalPayable={outstanding("PAYABLE")}
        customerNames={customers.map((c) => c.name)}
        supplierNames={suppliers.map((s) => s.name)}
      />
    </AppShell>
  );
}
