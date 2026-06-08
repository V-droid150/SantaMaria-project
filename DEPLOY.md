# Deploy SantaMaria ke Produksi (Vercel)

Aplikasi ini Next.js + Prisma + PostgreSQL (Supabase, sudah cloud). Cara tercepat go-live: **Vercel** (gratis untuk mulai).

## Prasyarat
- Kode sudah di GitHub: `https://github.com/V-droid150/SantaMaria-project` ✅
- Database Supabase sudah aktif & ter-migrasi ✅

---

## Langkah 1 — Import project ke Vercel
1. Buka **https://vercel.com** → login (bisa pakai GitHub `V-droid150`)
2. **Add New… → Project** → pilih repo **SantaMaria-project** → **Import**
3. Framework otomatis terdeteksi: **Next.js**. Build & output biarkan default.

## Langkah 2 — Isi Environment Variables
Di halaman import, buka **Environment Variables**, tambahkan (ambil nilai dari file `.env` lokalmu):

| Name | Value | Wajib? |
|------|-------|--------|
| `DATABASE_URL` | (pooler Supabase `:6543`, sama seperti `.env`) | ✅ |
| `DIRECT_URL` | (Supabase `:5432`) | ✅ |
| `AUTH_SECRET` | string acak min. 32 karakter | ✅ |
| `NEXT_PUBLIC_APP_URL` | `https://<nama-project>.vercel.app` (isi setelah tahu domainnya) | disarankan |
| `GOOGLE_CLIENT_ID` | dari Google Cloud | opsional (login Google) |
| `GOOGLE_CLIENT_SECRET` | dari Google Cloud | opsional |
| `ANTHROPIC_API_KEY` | dari console.anthropic.com | opsional (chatbot) |

> ⚠️ Jangan pakai prefix `NEXT_PUBLIC_` untuk secret (DATABASE_URL, AUTH_SECRET, dll) — itu akan terekspos ke browser. Hanya `NEXT_PUBLIC_APP_URL` yang boleh publik.

## Langkah 3 — Deploy
Klik **Deploy**. Vercel akan `npm install` (otomatis `prisma generate`) lalu `next build`. ±2 menit → dapat domain `https://<nama>.vercel.app`.

> Database sudah ter-migrasi (Supabase yang sama dengan dev), jadi tidak perlu migrate lagi. Untuk perubahan skema berikutnya: jalankan `npx prisma migrate deploy` terhadap DB produksi, atau tambahkan ke build command.

## Langkah 4 — Update Google OAuth untuk produksi (jika pakai login Google)
1. Salin domain Vercel-mu, set ke env `NEXT_PUBLIC_APP_URL`, lalu **Redeploy**.
2. Di **Google Cloud Console → Credentials → OAuth client** → tambahkan **Authorized redirect URI**:
   ```
   https://<nama>.vercel.app/api/auth/oauth/google/callback
   ```
3. Agar **semua orang** (bukan cuma test users) bisa login Google: di **OAuth consent screen**, klik **Publish app** (status Testing → In production).

## Langkah 5 — Coba
- Buka `https://<nama>.vercel.app` → daftar/login → pakai aplikasinya.
- Link toko publik pelanggan: `https://<nama>.vercel.app/toko/<slug-toko>`

---

## Install sebagai aplikasi (PWA)
Aplikasi sudah PWA — pengguna bisa "memasang"-nya:
- **Android (Chrome):** buka situs → menu ⋮ → **Add to Home screen / Install app**
- **iPhone (Safari):** tombol Share → **Add to Home Screen**
- **Desktop (Chrome/Edge):** ikon **Install** (⊕) di address bar

Setelah dipasang, muncul ikon SantaMaria di layar seperti aplikasi biasa, buka full-screen tanpa address bar.

> Catatan: tombol Install hanya muncul di **HTTPS** (otomatis di Vercel) — tidak akan muncul di `http://localhost` non-HTTPS.

---

## Domain sendiri (opsional)
Vercel → project → **Settings → Domains** → tambahkan domain milikmu (mis. `santamaria.id`), ikuti instruksi DNS. Lalu update `NEXT_PUBLIC_APP_URL` & redirect URI Google ke domain itu.
