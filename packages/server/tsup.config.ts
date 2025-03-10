import { defineConfig } from "tsup";

export default defineConfig({
	entry: [
		"./src/index.ts",
		"./src/{express,custom,elysia,next}/index.ts",
		"./src/adapters/*.ts",
	],
	dts: true,
	format: "esm",
});
