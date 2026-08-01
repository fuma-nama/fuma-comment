import { mkdir, writeFile } from "node:fs/promises";
import { compile, typegen } from "fuma-translate";
import { defineConfig } from "tsdown";

const config = defineConfig({
	entry: ["./src/index.tsx", "./src/atom.tsx", "./src/uploadthing/index.ts"],
	format: "esm",
	dts: true,
	target: "es2023",
	platform: "browser",
	ignoreWatch: ["src/.translations/**"],
	async onSuccess() {
		const start = performance.now();
		const output = await compile({
			input: ["src/**/*.ts", "src/**/*.tsx"],
		});

		await mkdir("src/.translations", { recursive: true });
		await writeFile("src/.translations/index.ts", typegen(output).replace(/^ {2}/gm, "\t"), "utf8");

		console.log(
			`generated ${output.translationKeys.length} translation keys in ${Math.round(performance.now() - start)}ms`,
		);
	},
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
