/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "var(--color-surface)",
          subtle:  "var(--color-surface-subtle)",
          muted:   "var(--color-surface-muted)",
        },
        border: {
          DEFAULT: "var(--color-border)",
          strong:  "var(--color-border-strong)",
        },
        text: {
          primary:   "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted:     "var(--color-text-muted)",
          subtle:    "var(--color-text-subtle)",
          label:     "var(--color-text-label)",
          heading:   "var(--color-text-heading)",
          error:     "var(--color-text-error)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          ring:    "var(--color-accent-ring)",
        },
        selection: {
          bg:   "var(--color-selection-bg)",
          text: "var(--color-selection-text)",
        },
        badge: {
          "sus-bg":      "var(--color-badge-sus-bg)",
          "sus-text":    "var(--color-badge-sus-text)",
          "nonsus-bg":   "var(--color-badge-nonsus-bg)",
          "nonsus-text": "var(--color-badge-nonsus-text)",
          "info-bg":     "var(--color-badge-info-bg)",
          "info-text":   "var(--color-badge-info-text)",
        },
      },
    },
  },
  plugins: [],
};
