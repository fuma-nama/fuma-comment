import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["./src/index.ts"],
	dts: true,
	format: "esm",
	target: "es2023",
	platform: "neutral",
	fixedExtension: false,
});
