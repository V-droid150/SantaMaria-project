import { DebtStatus } from "@prisma/client";

// Tentukan status dari total vs jumlah yang sudah dibayar.
// Catatan: OVERDUE (lewat tenggat) dihitung dinamis di UI dari dueDate,
// bukan disimpan permanen, agar tak perlu cron pengubah status.
export function computeStatus(amount: number, paid: number): DebtStatus {
  if (paid >= amount) return DebtStatus.PAID;
  if (paid > 0) return DebtStatus.PARTIAL;
  return DebtStatus.OPEN;
}
