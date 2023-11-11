import { defineConfig } from "tsup";

const config = defineConfig({
  entry: ["./src/index.tsx"],
  format: "esm",
  banner: () => ({ js: "'use client';" }),
  outExtension: () => ({ js: ".js" }),
});

export default config;
