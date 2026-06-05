import { redirect } from "next/navigation";

// Halaman root mengarahkan ke dasbor utama.
export default function Home() {
  redirect("/dashboard");
}
