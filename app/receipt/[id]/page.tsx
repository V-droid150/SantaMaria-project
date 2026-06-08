import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rupiah, tanggalJam } from "@/lib/format";
import PrintButton from "@/components/receipt/PrintButton";

const PAYMENT_LABEL: Record<string, string> = {
  CASH: "Tunai",
  QRIS: "QRIS",
  BANK_TRANSFER: "Transfer Bank",
  CARD: "Kartu",
  EWALLET: "E-Wallet",
  CREDIT: "Kredit/Kasbon",
};

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect(`/login?from=/receipt/${params.id}`);

  const order = await prisma.order.findFirst({
    where: { id: params.id, storeId: session.storeId },
    include: {
      store: true,
      user: { select: { name: true } },
      customer: { select: { name: true } },
      items: { include: { variant: { include: { product: { select: { name: true } } } } } },
    },
  });
  if (!order) notFound();

  const change = Number(order.paidAmount) - Number(order.grandTotal);

  return (
    <div className="min-h-screen bg-zinc-100 py-6 print:bg-white print:py-0">
      {/* Toolbar (sembunyi saat cetak) */}
      <div className="mx-auto mb-4 flex max-w-sm items-center justify-between px-4 print:hidden">
        <a href="/pos" className="text-sm font-semibold text-zinc-600 hover:text-zinc-900">
          ← Kembali ke Kasir
        </a>
        <PrintButton />
      </div>

      {/* Struk (lebar ~80mm) */}
      <div className="mx-auto max-w-[320px] bg-white p-5 text-zinc-900 shadow-sm print:max-w-none print:shadow-none">
        <div className="text-center">
          <h1 className="text-lg font-bold">{order.store.name}</h1>
          {order.store.address && <p className="text-xs text-zinc-500">{order.store.address}</p>}
          {order.store.phone && <p className="text-xs text-zinc-500">{order.store.phone}</p>}
        </div>

        <div className="my-3 border-t border-dashed border-zinc-300" />

        <div className="space-y-0.5 text-xs text-zinc-600">
          <div className="flex justify-between">
            <span>No.</span>
            <span className="font-medium text-zinc-900">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Tanggal</span>
            <span>{tanggalJam(order.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span>Kasir</span>
            <span>{order.user.name}</span>
          </div>
          {order.customer && (
            <div className="flex justify-between">
              <span>Pelanggan</span>
              <span>{order.customer.name}</span>
            </div>
          )}
        </div>

        <div className="my-3 border-t border-dashed border-zinc-300" />

        {/* Item */}
        <div className="space-y-2">
          {order.items.map((it) => {
            const label =
              it.variant.product.name +
              (it.variant.name !== "Default" ? ` (${it.variant.name})` : "");
            return (
              <div key={it.id} className="text-xs">
                <p className="font-medium text-zinc-900">{label}</p>
                <div className="flex justify-between text-zinc-600">
                  <span>
                    {it.quantity} x {rupiah(Number(it.unitPrice))}
                  </span>
                  <span>{rupiah(Number(it.subtotal))}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="my-3 border-t border-dashed border-zinc-300" />

        {/* Total */}
        <div className="space-y-1 text-xs">
          <Row label="Subtotal" value={rupiah(Number(order.subtotal))} />
          {Number(order.taxTotal) > 0 && <Row label="Pajak" value={rupiah(Number(order.taxTotal))} />}
          <div className="flex justify-between border-t border-zinc-300 pt-1 text-sm font-bold">
            <span>TOTAL</span>
            <span>{rupiah(Number(order.grandTotal))}</span>
          </div>
          <Row label={PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod} value={rupiah(Number(order.paidAmount))} />
          {order.paymentMethod === "CASH" && change >= 0 && (
            <Row label="Kembalian" value={rupiah(change)} />
          )}
        </div>

        <div className="my-3 border-t border-dashed border-zinc-300" />

        <p className="text-center text-xs text-zinc-500">Terima kasih atas kunjungan Anda 🙏</p>
        <p className="mt-1 text-center text-[10px] text-zinc-400">Dicetak via SantaMaria</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-zinc-600">
      <span>{label}</span>
      <span className="text-zinc-900">{value}</span>
    </div>
  );
}
