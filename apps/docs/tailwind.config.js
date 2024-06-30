import { createPreset as createCommentPreset } from "@fuma-comment/react/theme";
import { createPreset as createDocsPreset } from "fumadocs-ui/tailwind-plugin";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  presets: [createDocsPreset(), createCommentPreset()],
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
        "app-foreground": "rgb(var(--app-foreground))",
        "app-background": "rgb(var(--app-background))",
      },
      container: {
        center: true,
        padding: "1rem",
        screens: {
          "2xl": "1200px",
        },
      },
    },
  },
};
