import type { Metadata } from "next";
import LegalShell, { Section } from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Syarat Layanan — SantaMaria",
  description: "Ketentuan penggunaan aplikasi SantaMaria.",
};

const UPDATED = "10 Juni 2026";
const CONTACT = "kiekevin27@gmail.com";

export default function TermsPage() {
  return (
    <LegalShell title="Syarat Layanan" updated={UPDATED}>
      <p>
        Dengan membuat akun atau memakai aplikasi SantaMaria (&quot;Layanan&quot;), Anda menyetujui
        ketentuan berikut. Mohon baca dengan saksama.
      </p>

      <Section heading="1. Tentang Layanan">
        <p>
          SantaMaria adalah aplikasi manajemen bisnis untuk UMKM: kasir, inventaris, keuangan,
          pelanggan, laporan, dan toko online. Layanan disediakan &quot;sebagaimana adanya&quot; dan
          dapat berkembang dari waktu ke waktu.
        </p>
      </Section>

      <Section heading="2. Akun & tanggung jawab">
        <ul className="list-disc space-y-1 pl-5">
          <li>Anda bertanggung jawab menjaga kerahasiaan kata sandi dan aktivitas pada akun Anda.</li>
          <li>Anda menjamin data yang Anda masukkan akurat dan Anda berhak memprosesnya.</li>
          <li>Satu akun pendaftar menjadi pemilik (Admin) toko dan dapat menambah staf.</li>
        </ul>
      </Section>

      <Section heading="3. Penggunaan yang dilarang">
        <p>Anda setuju untuk tidak:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>menggunakan Layanan untuk aktivitas melanggar hukum atau menipu;</li>
          <li>mengganggu, meretas, atau membebani sistem secara tidak wajar;</li>
          <li>menjual atau menyalahgunakan data pelanggan pihak lain.</li>
        </ul>
      </Section>

      <Section heading="4. Pembayaran & transaksi">
        <p>
          Bila penjual mengaktifkan pembayaran online, transaksi diproses oleh penyedia pihak ketiga
          (mis. Midtrans). SantaMaria tidak bertanggung jawab atas sengketa antara penjual dan
          pembeli; tanggung jawab atas produk, pengiriman, dan layanan ada pada penjual.
        </p>
      </Section>

      <Section heading="5. Ketersediaan & batas tanggung jawab">
        <p>
          Kami berupaya menjaga Layanan tetap tersedia, namun tidak menjamin bebas gangguan atau
          kesalahan. Sejauh diizinkan hukum, SantaMaria tidak bertanggung jawab atas kerugian tidak
          langsung yang timbul dari penggunaan Layanan. Anda disarankan menyimpan cadangan data
          penting secara berkala.
        </p>
      </Section>

      <Section heading="6. Penghentian">
        <p>
          Anda dapat berhenti memakai Layanan kapan saja. Kami dapat menangguhkan akun yang melanggar
          ketentuan ini.
        </p>
      </Section>

      <Section heading="7. Perubahan & kontak">
        <p>
          Ketentuan dapat diperbarui sewaktu-waktu; perubahan berlaku saat dipublikasikan. Pertanyaan?
          Hubungi{" "}
          <a href={`mailto:${CONTACT}`} className="font-medium text-zinc-900 underline">
            {CONTACT}
          </a>
          .
        </p>
      </Section>
    </LegalShell>
  );
}
