import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Helper standar Shadcn UI untuk menggabungkan className secara aman.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
