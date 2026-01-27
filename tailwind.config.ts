import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Google Forms purple theme
        primary: {
          50: "#f3e5f5",
          100: "#e1bee7",
          200: "#ce93d8",
          300: "#ba68c8",
          400: "#ab47bc",
          500: "#9c27b0",
          600: "#8e24aa",
          700: "#7b1fa2",
          800: "#6a1b9a",
          900: "#4a148c",
        },
        // Form card background
        form: {
          bg: "#f0ebf8",
          card: "#ffffff",
          border: "#dadce0",
        },
        // Text colors
        text: {
          primary: "#202124",
          secondary: "#5f6368",
          error: "#d93025",
        },
      },
      fontFamily: {
        sans: ["Google Sans", "Roboto", "Arial", "sans-serif"],
      },
      boxShadow: {
        form: "0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)",
        "form-hover": "0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)",
      },
      borderRadius: {
        form: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
