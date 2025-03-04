import { defineConfig } from "tsup";

const config = defineConfig({
	entry: ["./src/index.tsx", "./src/atom.tsx"],
	format: "esm",
	external: ["tailwindcss"],
	dts: true,
});

export default config;
