import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palet "Shihu" — masih dark-mode, tapi lebih terang & lebih hangat
        // dibanding tema sebelumnya (base ungu-charcoal, aksen amber-coral).
        shihu: {
          bg: "#15111F",
          card: "#211B32",
          border: "#362D4C",
          borderSoft: "#413759",
          text: "#FBF9FF",
          muted: "#B7ADD1",
          faint: "#867BA0",
          corona: "#FFB238",
          coronaTo: "#FF7A45",
          violet: "#A385FF",
        },
        game: {
          genshin: "#FFB238",
          wuwa: "#4FE0FF",
          neverness: "#C2A3FF",
        },
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      backgroundImage: {
        corona: "linear-gradient(135deg, #FFB238, #FF7A45)",
      },
    },
  },
  plugins: [],
};

export default config;
