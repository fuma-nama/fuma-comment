import { defineConfig } from "tsup";

const config = defineConfig({
  entry: ["./src/index.tsx"],
  format: "esm",
  dts: true,
  banner: () => ({ js: "'use client';" }),
  outExtension: () => ({ js: ".js" }),
});

export default config;