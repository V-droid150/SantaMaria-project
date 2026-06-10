import type { Metadata } from "next";
import LegalShell, { Section } from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Kebijakan Privasi — SantaMaria",
  description: "Bagaimana SantaMaria mengumpulkan, memakai, dan melindungi data Anda.",
};

const UPDATED = "10 Juni 2026";
const CONTACT = "kiekevin27@gmail.com";

export default function PrivacyPage() {
  return (
    <LegalShell title="Kebijakan Privasi" updated={UPDATED}>
      <p>
        Kebijakan ini menjelaskan bagaimana SantaMaria (&quot;kami&quot;) mengumpulkan, menggunakan,
        dan melindungi data ketika Anda memakai aplikasi manajemen bisnis SantaMaria
        (&quot;Layanan&quot;).
      </p>

      <Section heading="1. Data yang kami kumpulkan">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <b>Data akun:</b> nama, email, dan kata sandi (disimpan ter-hash). Bila masuk lewat
            Google, kami menerima nama, email, dan foto profil dari Google.
          </li>
          <li>
            <b>Data bisnis Anda:</b> informasi toko, produk, stok, transaksi, keuangan, dan staf yang
            Anda masukkan ke Layanan.
          </li>
          <li>
            <b>Data pelanggan Anda:</b> nama, nomor telepon, dan alamat yang dimasukkan oleh Anda atau
            oleh pembeli saat memesan melalui halaman toko publik Anda. Anda adalah pengendali data
            ini; kami memprosesnya atas nama Anda.
          </li>
          <li>
            <b>Data teknis:</b> cookie sesi untuk menjaga Anda tetap masuk, dan alamat IP untuk
            keamanan (anti-bot).
          </li>
        </ul>
      </Section>

      <Section heading="2. Cara kami memakai data">
        <p>
          Kami memakai data untuk menyediakan dan mengoperasikan Layanan, memproses pembayaran,
          mengirim notifikasi yang Anda aktifkan, menjaga keamanan, dan meningkatkan kualitas
          aplikasi. Kami <b>tidak menjual</b> data Anda kepada pihak ketiga.
      </p>
      </Section>

      <Section heading="3. Pihak ketiga">
        <p>Layanan menggunakan penyedia berikut untuk berfungsi:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><b>Supabase</b> — penyimpanan database & berkas (foto/video produk).</li>
          <li><b>Vercel</b> — hosting aplikasi.</li>
          <li><b>Google</b> — autentikasi (login dengan Google), bila Anda memilihnya.</li>
          <li><b>Midtrans</b> — pemrosesan pembayaran online (bila diaktifkan penjual).</li>
          <li><b>Cloudflare Turnstile</b> — verifikasi anti-bot pada login/daftar.</li>
        </ul>
        <p>Data hanya dibagikan kepada penyedia ini sejauh diperlukan agar Layanan berjalan.</p>
      </Section>

      <Section heading="4. Penyimpanan & keamanan">
        <p>
          Kami menerapkan langkah keamanan wajar (enkripsi transport HTTPS, kata sandi ter-hash,
          isolasi data antar-toko, verifikasi anti-bot). Tidak ada sistem yang 100% aman, namun kami
          berupaya melindungi data Anda. Data disimpan selama akun Anda aktif.
        </p>
      </Section>

      <Section heading="5. Hak Anda">
        <p>
          Anda dapat mengakses, memperbarui, atau menghapus data akun Anda melalui menu Pengaturan &
          Profil, atau dengan menghubungi kami. Penghapusan akun akan menghapus data toko terkait.
        </p>
      </Section>

      <Section heading="6. Kontak">
        <p>
          Pertanyaan tentang privasi? Hubungi kami di{" "}
          <a href={`mailto:${CONTACT}`} className="font-medium text-zinc-900 underline">
            {CONTACT}
          </a>
          .
        </p>
      </Section>
    </LegalShell>
  );
}
