import type { Config } from "tailwindcss"

/**
 * Design system for the industrial data fabric preview.
 * Every colour used in the UI is declared here. Nothing else defines colour.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./context/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F7F8FA",
        surface: "#FFFFFF",
        hairline: "#E4E9ED",
        navy: {
          DEFAULT: "#0F2B46",
          muted: "#4A6076",
          faint: "#8A9AA8",
        },
        cyan: {
          DEFAULT: "#00A3C4",
          soft: "#E6F6FA",
          line: "#7FD1E2",
        },
        attention: { DEFAULT: "#B45309", soft: "#FDF3E7" },
        healthy: { DEFAULT: "#15803D", soft: "#EAF6EE" },
        blocked: { DEFAULT: "#B91C1C", soft: "#FBECEC" },
      },
      fontFamily: {
        sans: ["var(--font-plex-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: { card: "8px" },
      boxShadow: {
        card: "0 1px 2px rgba(15, 43, 70, 0.05), 0 1px 3px rgba(15, 43, 70, 0.06)",
        panel: "-8px 0 24px rgba(15, 43, 70, 0.10)",
      },
      spacing: { nav: "232px", panel: "420px" },
    },
  },
  plugins: [],
}

export default config
