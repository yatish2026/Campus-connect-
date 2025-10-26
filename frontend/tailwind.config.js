import daisyui from "daisyui";
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        "Campus Connect": {
          primary: "#0A66C2", // Campus Connect Blue (keeps existing palette)
          secondary: "#FFFFFF",
          accent: "#7FC15E",
          neutral: "#000000",
          "base-100": "#F3F2EF",
          info: "#5E5E5E",
          success: "#057642",
          warning: "#F5C75D",
          error: "#CC1016",
        },
      },
    ],
  },
};
