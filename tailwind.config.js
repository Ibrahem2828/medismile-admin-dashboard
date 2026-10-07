/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/hooks/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Font + type scale live in src/app/globals.css (@theme / :root) — no duplicate values here
      // Colors map to CSS variables only — hex lives in src/app/globals.css
      colors: {
        sky: {
          50: "var(--brand-sky-50)",
          100: "var(--brand-sky-100)",
          200: "var(--brand-sky-200)",
          300: "var(--brand-sky-300)",
          400: "var(--brand-sky-400)",
          500: "var(--brand-sky-500)",
          600: "var(--brand-sky-600)",
          700: "var(--brand-sky-700)",
          800: "var(--brand-sky-800)",
          900: "var(--brand-sky-900)",
        },
        dark: {
          DEFAULT: "var(--brand-dark)",
          light: "var(--brand-dark-light)",
          lighter: "var(--brand-dark-lighter)",
        },
        light: {
          DEFAULT: "var(--brand-light)",
          gray: "var(--brand-light-gray)",
        },
        primary: {
          DEFAULT: "var(--ds-primary)",
          hover: "var(--ds-primary-hover)",
          muted: "var(--ds-primary-muted)",
          foreground: "var(--ds-primary-foreground)",
        },
        background: "var(--ds-background)",
        surface: {
          DEFAULT: "var(--ds-surface)",
          elevated: "var(--ds-surface-elevated)",
        },
        text: {
          DEFAULT: "var(--ds-text)",
          secondary: "var(--ds-text-secondary)",
        },
        muted: "var(--ds-muted)",
        border: {
          DEFAULT: "var(--ds-border)",
          strong: "var(--ds-border-strong)",
        },
        ring: "var(--ds-ring)",
        success: "var(--ds-success)",
        warning: "var(--ds-warning)",
        danger: "var(--ds-danger)",
        info: "var(--ds-info)",
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          sm: "1.5rem",
          lg: "2rem",
          xl: "2.5rem",
          "2xl": "3rem",
        },
      },
    },
  },
  darkMode: ["class", 'selector([data-theme="dark"] &)'],
};
