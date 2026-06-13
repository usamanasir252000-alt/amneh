/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 32px 80px rgba(214, 90, 142, 0.16)",
      },
      colors: {
        blush: "#f6d1d8",
        petal: "#f8e4e7",
        pearl: "#ffffff",
        // rose: "#b0517f",
        light_blue: "#EAF6FC", // Very light blue
        soft_blue: "#83CEF4", // Bright soft blue
        Deep_blue: "#2f81b7da", // Deep blue accent
      },
    },
  },
  plugins: [],
};
