import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { canAccess } from "@/lib/rbac";

// Middleware proteksi route + RBAC. Berjalan di Edge Runtime.
// jose dipakai untuk verifikasi JWT (edge-safe).

const PUBLIC_PATHS = ["/login", "/signup"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Halaman katalog toko & halaman akses pesanan bersifat publik (tanpa login).
  if (pathname.startsWith("/toko/") || pathname.startsWith("/order/")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  // Path publik (login/signup): jika sudah login, lempar ke tujuan yang tepat.
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    if (session) {
      const url = req.nextUrl.clone();
      url.pathname = session.onboarded ? "/dashboard" : "/onboarding";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Belum login -> arahkan ke /login dengan callback.
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  const onOnboarding = pathname.startsWith("/onboarding");

  // Belum onboarding -> paksa selesaikan dulu.
  if (!session.onboarded && !onOnboarding) {
    const url = req.nextUrl.clone();
    url.pathname = "/onboarding";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Sudah onboarding tapi membuka /onboarding -> ke dasbor.
  if (session.onboarded && onOnboarding) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // RBAC: cek akses per-role (route /onboarding bebas).
  if (!onOnboarding && !canAccess(session.role, pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.searchParams.set("error", "forbidden");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Lindungi semua route HALAMAN. Semua /api dikecualikan karena tiap Route
// Handler sudah memvalidasi session sendiri (login/signup/oauth bersifat publik,
// onboarding/orders mengecek getSession). Jika /api ikut kena middleware,
// request POST bisa salah dialihkan saat user belum onboarded.
// PENTING: sw.js & manifest.webmanifest WAJIB dikecualikan, kalau tidak
// middleware mengembalikan HTML login -> PWA gagal "Install" & service worker
// ditolak (MIME type salah).
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
