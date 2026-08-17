/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff", 100: "#dbe6fe", 200: "#bcd1fd", 300: "#8fb3fb",
          400: "#5c8cf6", 500: "#3766ef", 600: "#254ad9", 700: "#1e3ab0",
          800: "#1d328c", 900: "#1c2d70"
        },
        surface: { DEFAULT: "#ffffff", muted: "#f7f8fb", dark: "#0f172a" }
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      borderRadius: { xl2: "1rem" },
      boxShadow: { card: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.10)" }
    }
  },
  plugins: []
};
