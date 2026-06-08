import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { canAccess, ROLE_LABEL } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/app/AppShell";
import FinanceClient, { type CashFlowRow } from "@/components/finance/FinanceClient";

export default async function FinancePage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/finance");
  if (!canAccess(session.role, "/finance")) redirect("/dashboard?error=forbidden");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [rows, monthAgg, allAgg] = await Promise.all([
    prisma.cashFlow.findMany({
      where: { storeId: session.storeId },
      orderBy: { occurredAt: "desc" },
      take: 100,
    }),
    prisma.cashFlow.groupBy({
      by: ["type"],
      where: { storeId: session.storeId, occurredAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.cashFlow.groupBy({
      by: ["type"],
      where: { storeId: session.storeId },
      _sum: { amount: true },
    }),
  ]);

  const sumOf = (agg: typeof monthAgg, type: string) =>
    Number(agg.find((a) => a.type === type)?._sum.amount ?? 0);

  const monthIncome = sumOf(monthAgg, "INCOME");
  const monthExpense = sumOf(monthAgg, "EXPENSE");
  const balance = sumOf(allAgg, "INCOME") - sumOf(allAgg, "EXPENSE");

  const data: CashFlowRow[] = rows.map((r) => ({
    id: r.id,
    type: r.type,
    amount: Number(r.amount),
    category: r.category,
    description: r.description,
    occurredAt: r.occurredAt.toISOString(),
    fromOrder: r.orderId !== null,
  }));

  return (
    <AppShell userName={session.name} roleLabel={ROLE_LABEL[session.role]} role={session.role}>
      <FinanceClient
        rows={data}
        monthIncome={monthIncome}
        monthExpense={monthExpense}
        balance={balance}
      />
    </AppShell>
  );
}
