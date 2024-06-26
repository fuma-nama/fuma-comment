import { createPreset as createCommentPreset } from "@fuma-comment/react/theme";
import { createPreset as createDocsPreset } from "fumadocs-ui/tailwind-plugin";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  presets: [createCommentPreset(), createDocsPreset()],
  content: [
    "./node_modules/fumadocs-ui/dist/**/*.js",
    "./node_modules/@fuma-comment/react/dist/**/*.js",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        foreground: "rgb(var(--app-foreground))",
        background: "rgb(var(--app-background))",
      },
      container: {
        center: true,
        padding: "1rem",
        screens: {
          "2xl": "1400px",
        },
      },
    },
  },
};
