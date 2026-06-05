// Tombol login sosial. Mengarah ke route inisiasi OAuth (server).
// Jika provider belum dikonfigurasi (env kosong), route akan
// mengembalikan user ke /login dengan pesan.

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.36 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.02-1.5-2.62-1.7-3.18-1.72-1.35-.14-2.64.8-3.32.8-.69 0-1.74-.78-2.86-.76-1.47.02-2.83.86-3.59 2.18-1.53 2.66-.39 6.6 1.1 8.76.73 1.06 1.6 2.25 2.74 2.2 1.1-.04 1.52-.71 2.85-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.08 2.65-2.14.84-1.23 1.18-2.42 1.2-2.48-.03-.01-2.3-.88-2.32-3.5ZM14.18 5.9c.6-.73 1.01-1.74.9-2.75-.87.04-1.92.58-2.54 1.3-.56.65-1.04 1.68-.91 2.67.97.07 1.95-.49 2.55-1.22Z" />
    </svg>
  );
}

export default function OAuthButtons({ from }: { from?: string }) {
  const q = from ? `?from=${encodeURIComponent(from)}` : "";
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      <a
        href={`/api/auth/oauth/google${q}`}
        className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
      >
        <GoogleIcon />
        Google
      </a>
      <a
        href={`/api/auth/oauth/apple${q}`}
        className="flex items-center justify-center gap-2 rounded-xl border border-zinc-900 bg-zinc-900 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
      >
        <AppleIcon />
        Apple
      </a>
    </div>
  );
}
