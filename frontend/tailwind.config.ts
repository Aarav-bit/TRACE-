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
          bg: "#070A11",
          card: "#0D1322",
          surface: "#131C31",
          panel: "#18233C",
          border: "#233354",
          borderLight: "#33476E",
          text: "#F8FAFC",
          muted: "#94A3B8",
          dim: "#64748B",
          accent: "#38BDF8",
          accentHover: "#0EA5E9",
          verified: "#10B981",
          verifiedBg: "#064E3B",
          warning: "#F59E0B",
          warningBg: "#78350F",
          danger: "#EF4444",
          dangerBg: "#7F1D1D",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
