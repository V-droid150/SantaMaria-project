import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Package,
  Download,
  ExternalLink,
  KeyRound,
  Store as StoreIcon,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { rupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

// Halaman ini berisi token rahasia -> jangan diindeks mesin pencari.
export const metadata: Metadata = {
  title: "Status Pesanan",
  robots: { index: false, follow: false },
};

type Params = { params: { token: string } };

export default async function OrderAccessPage({ params }: Params) {
  const order = await prisma.order.findUnique({
    where: { accessToken: params.token },
    select: {
      orderNumber: true,
      status: true,
      paymentStatus: true,
      subtotal: true,
      taxTotal: true,
      grandTotal: true,
      createdAt: true,
      note: true,
      store: { select: { name: true, slug: true, phone: true } },
      items: {
        select: {
          quantity: true,
          unitPrice: true,
          subtotal: true,
          variant: {
            select: {
              name: true,
              product: {
                select: { name: true, type: true, imageUrl: true, digitalUrl: true, digitalInfo: true },
              },
            },
          },
        },
      },
    },
  });

  if (!order) notFound();

  const isPaid = order.paymentStatus === "PAID";
  const isCancelled = order.status === "CANCELLED";
  const digitalItems = order.items.filter((it) => it.variant.product.type === "DIGITAL");
  const hasDigital = digitalItems.length > 0;

  const status = isCancelled
    ? { icon: XCircle, color: "text-red-500", bg: "bg-red-50", label: "Pesanan Dibatalkan" }
    : isPaid
    ? { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", label: "Pembayaran Lunas" }
    : { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50", label: "Menunggu Pembayaran" };
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900">
      {/* Header toko */}
      <header className="bg-zinc-900 text-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-6 sm:px-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-yellow-400 text-zinc-900">
            <StoreIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{order.store.name}</p>
            <p className="text-xs text-zinc-400">Status Pesanan</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6 sm:px-6">
        {/* Kartu status */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${status.bg}`}>
              <StatusIcon className={`h-7 w-7 ${status.color}`} />
            </div>
            <div>
              <p className="text-lg font-bold">{status.label}</p>
              <p className="text-sm text-zinc-500">No. Pesanan {order.orderNumber}</p>
            </div>
          </div>
          {!isPaid && !isCancelled && (
            <p className="mt-4 rounded-xl bg-yellow-400/10 px-3 py-2 text-sm text-zinc-600">
              Pesananmu sudah tercatat. Setelah pembayaran dikonfirmasi penjual
              {hasDigital ? ", produk digital akan muncul di halaman ini" : ""}. Muat ulang halaman
              ini untuk memperbarui status.
            </p>
          )}
        </div>

        {/* Produk digital (hanya setelah lunas) */}
        {hasDigital && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <h2 className="mb-3 flex items-center gap-2 font-bold">
              <Download className="h-5 w-5 text-yellow-500" /> Produk Digital
            </h2>
            {isPaid ? (
              <ul className="space-y-3">
                {digitalItems.map((it, i) => {
                  const p = it.variant.product;
                  return (
                    <li key={i} className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-3">
                      <p className="font-semibold">
                        {p.name}
                        {it.variant.name !== "Default" ? ` · ${it.variant.name}` : ""}
                      </p>
                      {p.digitalUrl ? (
                        <a
                          href={p.digitalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                        >
                          <ExternalLink className="h-4 w-4 text-yellow-400" /> Buka / Unduh
                        </a>
                      ) : (
                        <p className="mt-1 text-sm text-zinc-500">
                          Penjual akan mengirimkan akses produk ini.
                        </p>
                      )}
                      {p.digitalInfo && (
                        <div className="mt-2 flex items-start gap-2 rounded-lg border border-dashed border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600">
                          <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                          <span className="whitespace-pre-wrap">{p.digitalInfo}</span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-xl bg-zinc-50 px-3 py-3 text-sm text-zinc-500">
                🔒 Tautan & akses produk digital akan tampil di sini setelah pembayaran lunas.
              </p>
            )}
          </div>
        )}

        {/* Rincian pesanan */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-3 flex items-center gap-2 font-bold">
            <Package className="h-5 w-5 text-zinc-400" /> Rincian Pesanan
          </h2>
          <ul className="divide-y divide-zinc-100">
            {order.items.map((it, i) => (
              <li key={i} className="flex justify-between gap-3 py-2 text-sm">
                <span className="text-zinc-600">
                  {it.quantity}× {it.variant.product.name}
                  {it.variant.name !== "Default" ? ` (${it.variant.name})` : ""}
                </span>
                <span className="font-medium">{rupiah(Number(it.subtotal))}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t border-dashed border-zinc-200 pt-3 text-sm">
            <div className="flex justify-between text-zinc-500">
              <span>Subtotal</span>
              <span>{rupiah(Number(order.subtotal))}</span>
            </div>
            {Number(order.taxTotal) > 0 && (
              <div className="flex justify-between text-zinc-500">
                <span>Pajak</span>
                <span>{rupiah(Number(order.taxTotal))}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 text-base font-bold">
              <span>Total</span>
              <span>{rupiah(Number(order.grandTotal))}</span>
            </div>
          </div>
          {order.note && (
            <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
              Catatan: {order.note}
            </p>
          )}
        </div>

        {order.store.slug && (
          <div className="text-center">
            <Link
              href={`/toko/${order.store.slug}`}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-yellow-400"
            >
              <StoreIcon className="h-4 w-4" /> Kembali ke {order.store.name}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
