import { defineConfig } from "tsup";

const config = defineConfig({
  entry: ["./index.tsx"],
  format: "esm",
  outExtension: () => ({ js: ".js" }),
});

// eslint-disable-next-line -- No allowed
export default config;
