import { defineConfig } from "tsup";

const config = defineConfig({
  entry: ["./src/index.tsx", "./src/atom.tsx", "./src/uploadthing/index.ts"],
  format: "esm",
  external: ["tailwindcss", "uploadthing"],
  dts: true,
});

export default config;
