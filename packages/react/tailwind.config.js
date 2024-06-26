import { createPreset } from "./dist/theme";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [createPreset()],
};
