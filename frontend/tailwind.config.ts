import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#0B0F17",           // Soft deep graphite
          card: "#111726",         // Clean slate container
          surface: "#172033",      // Slightly elevated element
          panel: "#1D283F",        // Elevated hover/active element
          border: "#1E293B",       // Clean slate-800 border
          borderLight: "#334155",  // Slate-700 hover border
          text: "#F8FAFC",         // High-contrast clean white
          muted: "#94A3B8",        // Crisp muted slate
          dim: "#64748B",          // Subtle slate
          accent: "#38BDF8",       // Crisp sky blue
          accentHover: "#0284C7",
          verified: "#10B981",     // Clean emerald
          verifiedBg: "#064E3B",
          warning: "#F59E0B",      // Amber
          warningBg: "#451A03",
          danger: "#EF4444",       // Rose/Red
          dangerBg: "#4C0519",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
