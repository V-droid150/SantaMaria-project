import sharp from "sharp";
import { mkdirSync } from "fs";
import { join } from "path";
import { SHIP_PATHS } from "../lib/brand";

// Generate ikon PWA: kapal SantaMaria (kuning) di atas latar hitam. Jalankan:
//   npx tsx scripts/gen-icons.ts
const PUBLIC = join(process.cwd(), "public");
mkdirSync(PUBLIC, { recursive: true });

const BG = "#18181b"; // zinc-900
const FG = "#facc15"; // yellow-400

// Kelompok path kapal, diskala & ditengahkan dgn margin aman `safe` (rasio).
function ship(size: number, safe: number): string {
  const inset = size * safe;
  const scale = (size - inset * 2) / 64;
  const paths = SHIP_PATHS.map((d) => `<path d="${d}"/>`).join("");
  return `<g transform="translate(${inset} ${inset}) scale(${scale})" fill="${FG}">${paths}</g>`;
}

function svg(size: number, radius: number, safe: number): Buffer {
  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${BG}"/>
  ${ship(size, safe)}
</svg>`);
}

async function gen(name: string, buf: Buffer) {
  await sharp(buf).png().toFile(join(PUBLIC, name));
  console.log("✓", name);
}

async function main() {
  await gen("icon-192.png", svg(192, Math.round(192 * 0.22), 0.18));
  await gen("icon-512.png", svg(512, Math.round(512 * 0.22), 0.18));
  await gen("apple-touch-icon.png", svg(180, Math.round(180 * 0.22), 0.18));
  // Maskable: latar penuh tanpa sudut, kapal diberi margin aman lebih besar.
  await gen("icon-maskable-512.png", svg(512, 0, 0.28));
  // Favicon tab browser (Next memakai app/icon.png otomatis).
  await sharp(svg(256, Math.round(256 * 0.22), 0.18))
    .png()
    .toFile(join(process.cwd(), "app", "icon.png"));
  console.log("✓ app/icon.png");
}

main();
