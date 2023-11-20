import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/index.ts", "./src/{next,express,custom}/index.ts"],
  dts: true,
  external: ["next"],
});
