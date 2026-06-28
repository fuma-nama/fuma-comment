import { defineConfig } from "tsdown";

export default defineConfig({
	entry: [
		"./src/index.ts",
		"./src/cli/index.ts",
		"./src/{express,custom,elysia,fastify,next,hono}/index.ts",
		"./src/adapters/*.ts",
	],
	dts: true,
	format: "esm",
	target: "es2023",
	platform: "neutral",
	exports: true,
	deps: {
		onlyBundle: ["path-to-regexp"],
	},
});
