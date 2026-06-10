import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";
import { isStorageConfigured, getStorageClient, STORAGE_BUCKET } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

// Upload file (mis. video produk) ke Supabase Storage, kembalikan URL publik.
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!canAccess(session.role, "/inventory")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "Upload belum dikonfigurasi. Gunakan link video untuk sementara." },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
  }
  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");
  if (!isVideo && !isImage) {
    return NextResponse.json({ error: "File harus berupa gambar atau video" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Ukuran file maksimal 50 MB" }, { status: 400 });
  }

  const folder = isVideo ? "videos" : "images";
  const ext = (file.name.split(".").pop() || (isVideo ? "mp4" : "jpg"))
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const path = `${folder}/${session.storeId}/${crypto.randomUUID()}.${ext}`;

  try {
    const supabase = getStorageClient();
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false });
    if (error) throw error;

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal mengunggah";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
