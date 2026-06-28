import { defineConfig } from "tsdown";

const config = defineConfig({
	entry: ["./src/index.tsx", "./src/atom.tsx", "./src/uploadthing/index.ts"],
	format: "esm",
	dts: true,
	target: "es2023",
	platform: "browser",
	deps: {
		onlyBundle: [],
	},
	exports: {
		customExports: {
			"./style.css": "./dist/style.css",
			"./preset.css": "./css/preset.css",
		},
	},
});

export default config;
