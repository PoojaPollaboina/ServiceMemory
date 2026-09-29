import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"] },
      colors: { brand: { 50: "#eef4ff", 500: "#2f5bea", 600: "#2448c4", 700: "#1d3a9e" } },
    },
  },
  plugins: [],
};
export default config;
