import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured, sendEmail, appOrigin } from "@/lib/email";

export const runtime = "nodejs";

// Minta tautan reset password. Selalu balas sukses generik agar tidak
// membocorkan apakah suatu email terdaftar.
export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });

  const generic = NextResponse.json({ ok: true });

  const user = await prisma.user.findUnique({ where: { email } });
  // Hanya untuk akun email/password aktif (akun Google tak punya password).
  if (!user || !user.isActive || !user.passwordHash) return generic;

  // Token mentah dikirim via email; di DB hanya simpan hash-nya.
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 jam

  await prisma.passwordResetToken.create({
    data: { tokenHash, userId: user.id, expiresAt },
  });

  const link = `${appOrigin(req)}/reset-password?token=${rawToken}`;

  if (isEmailConfigured()) {
    await sendEmail({
      to: email,
      subject: "Reset password SantaMaria",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2>Reset Password</h2>
          <p>Halo ${user.name}, kami menerima permintaan reset password akun SantaMaria kamu.</p>
          <p><a href="${link}" style="display:inline-block;background:#facc15;color:#18181b;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">Atur Password Baru</a></p>
          <p style="color:#71717a;font-size:13px">Tautan berlaku 1 jam. Abaikan email ini bila kamu tidak meminta reset.</p>
        </div>`,
    });
  } else {
    // Email belum dikonfigurasi (mis. dev): catat tautan ke log server.
    console.log(`[forgot-password] Email belum dikonfigurasi. Tautan reset untuk ${email}: ${link}`);
  }

  return generic;
}
