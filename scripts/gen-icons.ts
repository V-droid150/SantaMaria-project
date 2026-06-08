import sharp from "sharp";
import { mkdirSync } from "fs";
import { join } from "path";

// Generate ikon PWA dari SVG (logo "S" kuning di atas hitam). Jalankan sekali.
const PUBLIC = join(process.cwd(), "public");
mkdirSync(PUBLIC, { recursive: true });

function svg(size: number, padding = 0): Buffer {
  const r = Math.round(size * 0.22); // sudut membulat
  const fontSize = Math.round((size - padding * 2) * 0.62);
  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#18181b"/>
  <text x="50%" y="50%" dy="0.35em" text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif" font-weight="800"
    font-size="${fontSize}" fill="#facc15">S</text>
</svg>`);
}

async function gen(name: string, size: number, padding = 0) {
  await sharp(svg(size, padding)).png().toFile(join(PUBLIC, name));
  console.log("✓", name);
}

async function main() {
  await gen("icon-192.png", 192);
  await gen("icon-512.png", 512);
  await gen("apple-touch-icon.png", 180);
  // Maskable: beri ruang aman (padding) agar tidak terpotong saat di-mask.
  await sharp(
    Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#18181b"/>
  <text x="50%" y="50%" dy="0.35em" text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif" font-weight="800"
    font-size="240" fill="#facc15">S</text>
</svg>`)
  )
    .png()
    .toFile(join(PUBLIC, "icon-maskable-512.png"));
  console.log("✓ icon-maskable-512.png");
}

main();
