import Link from "next/link";
import { ShihuMark } from "@/components/ShihuMark";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center relative px-6">
      <div className="shihu-glow-top" />
      <div className="shihu-glow-bottom" />

      <div className="relative z-10 w-full max-w-md text-center">
        <div className="flex justify-center items-center gap-2 mb-6">
          <ShihuMark size={26} />
          <span className="font-display text-base font-bold">Shihu Service</span>
        </div>

        <p className="font-display text-6xl font-bold text-shihu-corona mb-3">404</p>
        <h1 className="font-display text-xl font-bold mb-2">Halaman tidak ditemukan</h1>
        <p className="text-shihu-muted text-sm leading-relaxed mb-8">
          Link yang kamu buka mungkin sudah tidak berlaku, salah ketik, atau memang
          belum pernah ada.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl font-display font-semibold text-sm text-[#1A1206] bg-corona hover:opacity-90 transition-opacity"
          >
            Kembali ke beranda
          </Link>
          <Link
            href="/antrian"
            className="px-5 py-2.5 rounded-xl font-display font-semibold text-sm text-shihu-muted bg-[#2C2540] hover:bg-[#332B4A] transition-colors"
          >
            Lihat antrian
          </Link>
        </div>
      </div>
    </div>
  );
}
