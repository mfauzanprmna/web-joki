import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palet Shihu: navy gelap dengan aksen biru elektrik.
        //
        // Nilai warnanya TIDAK di-hardcode di sini lagi -- tiap token
        // menunjuk ke CSS variable (didefinisikan di app/globals.css, format
        // "R G B" tanpa fungsi rgb() supaya modifier opacity Tailwind macam
        // bg-shihu-corona/10 tetap jalan). :root berisi nilai mode gelap
        // (default), lalu [data-theme="light"] meng-override semuanya ke
        // nilai mode terang -- jadi SATU definisi token di sini otomatis
        // berlaku untuk kedua tema, tidak perlu varian shihu-light-xxx dst.
        shihu: {
          bg: "rgb(var(--shihu-bg) / <alpha-value>)",
          card: "rgb(var(--shihu-card) / <alpha-value>)",
          border: "rgb(var(--shihu-border) / <alpha-value>)",
          borderSoft: "rgb(var(--shihu-border-soft) / <alpha-value>)",
          text: "rgb(var(--shihu-text) / <alpha-value>)",
          muted: "rgb(var(--shihu-muted) / <alpha-value>)",
          faint: "rgb(var(--shihu-faint) / <alpha-value>)",
          corona: "rgb(var(--shihu-corona) / <alpha-value>)",
          coronaTo: "rgb(var(--shihu-corona-to) / <alpha-value>)",
          violet: "rgb(var(--shihu-violet) / <alpha-value>)",
        },
        // Aksen per-game -- dipakai sebagai dot/badge kecil, sengaja tetap
        // sama di kedua tema (tidak butuh kontras teks besar).
        game: {
          genshin: "#8CC8FF",
          wuwa: "#62D9FF",
          neverness: "#A8B8FF",
        },
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      backgroundImage: {
        corona: "linear-gradient(135deg, #54A7FF, #236DE3)",
      },
    },
  },
  plugins: [],
};

export default config;
