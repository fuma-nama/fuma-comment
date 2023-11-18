import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/index.ts", "./src/next/index.ts"],
  dts: true,
  external: ["next"],
});
