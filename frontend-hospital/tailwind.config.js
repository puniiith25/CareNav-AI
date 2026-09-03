/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-dm)", "system-ui", "sans-serif"],
        serif: ["var(--font-source)", "Georgia", "serif"],
      },
      colors: {
        sand: "var(--sand)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        teal: {
          DEFAULT: "var(--teal)",
          dark: "var(--teal-dark)",
        },
        card: "var(--card)",
        line: "var(--line)",
        danger: "var(--danger)",
      },
    },
  },
  plugins: [],
};
