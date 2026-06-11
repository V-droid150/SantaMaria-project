import { SHIP_PATHS, LOGO_VIEWBOX } from "@/lib/brand";

// Logo kapal SantaMaria. Mewarisi warna dari `currentColor` (ikut tema box-nya).
export default function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${LOGO_VIEWBOX} ${LOGO_VIEWBOX}`}
      fill="currentColor"
      className={className}
      role="img"
      aria-label="SantaMaria"
    >
      {SHIP_PATHS.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
