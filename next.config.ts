import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Halaman /joki (list semua game) sudah digabung ke beranda -- desain
      // baru gaya web top-up: pilih game di beranda, lalu semua layanan
      // game itu tampil di satu halaman /[slug] (mis. /genshin).
      {
        source: "/joki",
        destination: "/",
        permanent: true,
      },
      // Link lama /joki?game=genshin -> diarahkan ke halaman per-game baru.
      // Next.js redirects() tidak mendukung wildcard di query string secara
      // langsung untuk semua kemungkinan slug, jadi didaftarkan eksplisit
      // per game (jumlahnya kecil & jarang berubah).
      { source: "/joki", destination: "/genshin", permanent: true, has: [{ type: "query", key: "game", value: "genshin" }] },
      { source: "/joki", destination: "/wuwa", permanent: true, has: [{ type: "query", key: "game", value: "wuwa" }] },
      { source: "/joki", destination: "/neverness", permanent: true, has: [{ type: "query", key: "game", value: "neverness" }] },
    ];
  },
};

export default nextConfig;
