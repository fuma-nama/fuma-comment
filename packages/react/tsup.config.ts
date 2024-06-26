import { defineConfig } from "tsup";

const config = defineConfig({
  entry: ["./src/index.tsx", "./src/theme/index.ts", "./src/atom.tsx"],
  format: "esm",
  dts: true,
});

export default config;
