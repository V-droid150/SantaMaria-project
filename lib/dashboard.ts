import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentStatus, ProductType } from "@prisma/client";

const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export type DashboardData = {
  revenue: number;
  profit: number;
  orderCount: number;
  lowStockCount: number;
  trend: { month: string; revenue: number }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    customer: string;
    channel: string;
    total: number;
    status: OrderStatus;
  }[];
  lowStock: { id: string; name: string; stock: number }[];
  dueDebts: { id: string; label: string; amount: number; dueDate: Date | null }[];
  hasAnyData: boolean;
};

export async function getDashboardData(storeId: string): Promise<DashboardData> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const trendStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [paidThisMonth, orderCount, recentOrdersRaw, variants, paidForTrend, dueDebtsRaw, totalOrdersEver] =
    await Promise.all([
      // Order LUNAS bulan ini (untuk pendapatan & laba)
      prisma.order.findMany({
        where: { storeId, paymentStatus: PaymentStatus.PAID, createdAt: { gte: monthStart } },
        select: {
          grandTotal: true,
          items: { select: { quantity: true, unitPrice: true, costPrice: true } },
        },
      }),
      // Jumlah pesanan bulan ini (selain draft)
      prisma.order.count({
        where: { storeId, status: { not: OrderStatus.DRAFT }, createdAt: { gte: monthStart } },
      }),
      // 5 pesanan terbaru
      prisma.order.findMany({
        where: { storeId, status: { not: OrderStatus.DRAFT } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          channel: true,
          grandTotal: true,
          status: true,
          customer: { select: { name: true } },
        },
      }),
      // Varian fisik untuk hitung stok menipis
      prisma.productVariant.findMany({
        where: { isActive: true, product: { storeId, type: ProductType.PHYSICAL, isActive: true } },
        select: { id: true, name: true, stock: true, reorderPoint: true, product: { select: { name: true } } },
      }),
      // Order LUNAS 12 bulan terakhir (untuk grafik tren)
      prisma.order.findMany({
        where: { storeId, paymentStatus: PaymentStatus.PAID, createdAt: { gte: trendStart } },
        select: { grandTotal: true, createdAt: true },
      }),
      // Hutang/piutang jatuh tempo / lewat tempo
      prisma.debt.findMany({
        where: { storeId, status: { in: ["OPEN", "PARTIAL", "OVERDUE"] } },
        orderBy: { dueDate: "asc" },
        take: 5,
        select: {
          id: true,
          type: true,
          amount: true,
          paidAmount: true,
          dueDate: true,
          customer: { select: { name: true } },
          supplier: { select: { name: true } },
        },
      }),
      prisma.order.count({ where: { storeId, status: { not: OrderStatus.DRAFT } } }),
    ]);

  // Pendapatan & laba kotor bulan ini
  let revenue = 0;
  let profit = 0;
  for (const o of paidThisMonth) {
    revenue += Number(o.grandTotal);
    for (const it of o.items) {
      profit += (Number(it.unitPrice) - Number(it.costPrice)) * it.quantity;
    }
  }

  // Stok menipis (stock <= reorderPoint)
  const low = variants.filter((v) => v.stock <= v.reorderPoint);
  const lowStock = low
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5)
    .map((v) => ({
      id: v.id,
      name: v.product.name + (v.name !== "Default" ? ` · ${v.name}` : ""),
      stock: v.stock,
    }));

  // Tren 12 bulan
  const buckets = new Map<string, number>();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    buckets.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
  }
  for (const o of paidForTrend) {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + Number(o.grandTotal));
  }
  const trend = Array.from(buckets.entries()).map(([key, val]) => {
    const month = Number(key.split("-")[1]);
    return { month: MONTHS_ID[month], revenue: val };
  });

  const dueDebts = dueDebtsRaw.map((d) => ({
    id: d.id,
    label:
      (d.type === "RECEIVABLE" ? "Piutang: " : "Hutang: ") +
      (d.customer?.name ?? d.supplier?.name ?? "—"),
    amount: Number(d.amount) - Number(d.paidAmount),
    dueDate: d.dueDate,
  }));

  return {
    revenue,
    profit,
    orderCount,
    lowStockCount: low.length,
    trend,
    recentOrders: recentOrdersRaw.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customer: o.customer?.name ?? "Tamu",
      channel: o.channel,
      total: Number(o.grandTotal),
      status: o.status,
    })),
    lowStock,
    dueDebts,
    hasAnyData: totalOrdersEver > 0,
  };
}
