/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        palette: {
          black: "#000000",
          lime: "#D2FF8F",
          mint: "#29A683",
          teal: "#238C6E",
          white: "#F2F2F2",
          // Surface shades based on palette
          bg: "#040907",
          surface: "#07120d",
          card: "#0b1a13",
          border: "rgba(41, 166, 131, 0.35)",
          glow: "rgba(210, 255, 143, 0.35)"
        }
      }
    },
  },
  plugins: [],
}
