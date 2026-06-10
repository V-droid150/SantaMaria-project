/** @type {import('next').NextConfig} */

// Header keamanan diterapkan ke semua route.
// - HSTS: paksa HTTPS (Vercel sudah HTTPS).
// - X-Frame-Options + frame-ancestors: cegah clickjacking (dashboard di-iframe).
// - X-Content-Type-Options: cegah MIME-sniffing.
// - Referrer-Policy & Permissions-Policy: kurangi kebocoran data & izin perangkat.
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // CSP konservatif: izinkan inline (Next perlu) + Midtrans Snap + Supabase + data URL gambar.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.midtrans.com https://app.sandbox.midtrans.com https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "media-src 'self' https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-src 'self' https://app.midtrans.com https://app.sandbox.midtrans.com https://challenges.cloudflare.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
