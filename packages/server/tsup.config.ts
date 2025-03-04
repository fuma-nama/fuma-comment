import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["./src/index.ts", "./src/{express,custom}/index.ts"],
	dts: true,
});
