import "server-only";
import { createHash } from "crypto";

// Integrasi Midtrans Snap (server-side). Gated by env:
// MIDTRANS_SERVER_KEY, MIDTRANS_CLIENT_KEY, MIDTRANS_IS_PRODUCTION ("true"/"false").

const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";
const CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || "";
const IS_PROD = process.env.MIDTRANS_IS_PRODUCTION === "true";

const API_BASE = IS_PROD ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com";

export function isMidtransConfigured(): boolean {
  return Boolean(SERVER_KEY && CLIENT_KEY);
}

export function midtransClientKey(): string {
  return CLIENT_KEY;
}

export function snapJsUrl(): string {
  return `${API_BASE}/snap/snap.js`;
}

// Buat transaksi Snap, kembalikan token untuk popup pembayaran.
export async function createSnapToken(params: {
  orderId: string;
  grossAmount: number;
  customerName: string;
  customerPhone?: string | null;
}): Promise<string> {
  const res = await fetch(`${API_BASE}/snap/v1/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Basic " + Buffer.from(SERVER_KEY + ":").toString("base64"),
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: params.orderId,
        gross_amount: Math.round(params.grossAmount),
      },
      customer_details: {
        first_name: params.customerName,
        phone: params.customerPhone || undefined,
      },
      credit_card: { secure: true },
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = Array.isArray(data?.error_messages)
      ? data.error_messages.join(", ")
      : "Gagal membuat transaksi pembayaran";
    throw new Error(msg);
  }
  return data.token as string;
}

// Verifikasi tanda tangan webhook notifikasi Midtrans.
export function verifyNotificationSignature(n: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}): boolean {
  const raw = n.order_id + n.status_code + n.gross_amount + SERVER_KEY;
  const hash = createHash("sha512").update(raw).digest("hex");
  return hash === n.signature_key;
}

// Peta payment_type Midtrans -> enum PaymentMethod aplikasi.
export function mapPaymentMethod(paymentType?: string): "QRIS" | "EWALLET" | "BANK_TRANSFER" | "CARD" | "CASH" {
  switch (paymentType) {
    case "qris":
      return "QRIS";
    case "gopay":
    case "shopeepay":
    case "dana":
    case "ovo":
      return "EWALLET";
    case "bank_transfer":
    case "echannel":
    case "permata":
    case "cstore":
      return "BANK_TRANSFER";
    case "credit_card":
      return "CARD";
    default:
      return "CASH";
  }
}
