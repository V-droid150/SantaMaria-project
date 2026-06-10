import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";

// Chatbot AI "Maria" — pakai Anthropic SDK resmi, streaming.
// Default model Claude Opus 4.8; bisa diganti via env CHAT_MODEL (mis. claude-haiku-4-5 utk hemat).

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `Kamu adalah "Maria", asisten AI ramah di dalam aplikasi SantaMaria — aplikasi kasir & manajemen bisnis untuk UMKM (menjual produk fisik maupun digital).

Tugasmu:
- Membantu pengguna memakai aplikasi SantaMaria: Dasbor, Penjualan & Kasir (POS), Inventaris (produk, varian, stok, stock opname), Keuangan (arus kas), Pelanggan, Laporan, Pengaturan (termasuk PPN), Manajemen Staf, dan cetak struk.
- Menjawab pertanyaan umum apa pun (bisnis, tips jualan, hitungan sederhana, dll) dengan akurat dan membantu.

Aturan gaya:
- WAJIB membalas dalam bahasa & gaya yang sama dengan pengguna. Jika ia menulis bahasa Indonesia baku, balas baku; jika santai/informal, balas santai; jika bahasa Inggris, balas bahasa Inggris; bahasa daerah pun ikuti.
- Ringkas, jelas, dan langsung ke inti. Gunakan poin bila perlu. Jangan bertele-tele.
- Jika diminta langkah memakai fitur, beri langkah singkat dan sebutkan nama menunya.
- Jangan mengarang fitur yang tidak ada. Jika tidak yakin, katakan dengan jujur.
- Jawab langsung tanpa menampilkan proses berpikirmu.`;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return new Response(JSON.stringify({ error: "Tidak terautentikasi" }), { status: 401 });
  }

  // Rate limit: cegah abuse biaya AI (per user).
  if (!(await rateLimit("chat", session.userId, 30, "5 m"))) {
    return new Response(
      JSON.stringify({ error: "Terlalu banyak pesan. Tunggu sebentar ya." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Chatbot belum dikonfigurasi (ANTHROPIC_API_KEY kosong)." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Body tidak valid" }), { status: 400 });
  }

  const incoming = Array.isArray(body.messages) ? body.messages : [];
  const messages = incoming
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-20) // batasi riwayat agar hemat token
    .map((m) => ({ role: m.role, content: m.content }));

  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return new Response(JSON.stringify({ error: "Pesan tidak valid" }), { status: 400 });
  }

  const client = new Anthropic();
  const model = process.env.CHAT_MODEL || "claude-opus-4-8";

  const stream = client.messages.stream({
    model,
    max_tokens: 1024,
    system: `${SYSTEM_PROMPT}\n\nNama pengguna saat ini: ${session.name}.`,
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch {
        controller.enqueue(encoder.encode("\n\n⚠️ Maaf, terjadi gangguan. Coba lagi ya."));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
