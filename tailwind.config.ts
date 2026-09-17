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
        shihu: {
          bg: "#07111F",
          card: "#0D1B2D",
          border: "#1C3553",
          borderSoft: "#2C4C72",
          text: "#F4F8FF",
          muted: "#A8BAD2",
          faint: "#7187A5",
          corona: "#4D9CFF",
          coronaTo: "#236DE3",
          violet: "#79B7FF",
        },
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
