/** @type {import('tailwindcss').Config} */
module.exports = {
  // 1. Tell Tailwind exactly where your files are
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  // 2. Tell Tailwind to use NativeWind to translate for mobile
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // If you had custom colors in your web version, add them here later!
      colors: {
        background: "#f8fafc",
        foreground: "#0f172a",
      }
    },
  },
  plugins: [],
}