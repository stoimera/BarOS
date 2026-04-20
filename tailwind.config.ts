import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Public-facing theme colors (Blue)
        brand: {
          light: {
            primary: "#3B82F6", // blue-500
            secondary: "#2563EB", // blue-600
            accent: "#3B82F6", // blue-500
            surface: "#F9FAFB", // gray-50
            background: "#FAFAFA", // neutral-50
            text: "#1F2937", // gray-800
          },
          dark: {
            primary: "#60A5FA", // blue-400
            secondary: "#3B82F6", // blue-500
            accent: "#60A5FA", // blue-400
            surface: "#0F172A", // slate-900
            background: "#1F2937", // gray-800
            text: "#F9FAFB", // gray-50
          }
        },
        // Internal CRM theme colors (Slate/Blue)
        crm: {
          light: {
            primary: "#3B82F6", // blue-500
            secondary: "#2563EB", // blue-600
            accent: "#1D4ED8", // blue-700
            surface: "#F9FAFB", // gray-50
            background: "#FFFFFF", // white
            text: "#1E293B", // slate-800
          },
          dark: {
            primary: "#60A5FA", // blue-400
            secondary: "#3B82F6", // blue-500
            accent: "#2563EB", // blue-600
            surface: "#0F172A", // slate-900
            background: "#020617", // slate-950
            text: "#F3F4F6", // gray-100
          }
        },
        // Universal status colors (consistent across themes)
        status: {
          error: "#EF4444", // red-500
          success: "#10B981", // green-500
          warning: "#3B82F6", // blue-500 (using primary blue)
          info: "#3B82F6", // blue-500
        }
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config; 