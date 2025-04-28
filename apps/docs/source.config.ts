import { remarkDocGen, remarkInstall, fileGenerator } from "fumadocs-docgen";
import { defineConfig } from "fumadocs-mdx/config";
import { defineDocs } from "fumadocs-mdx/config";

export const docs = defineDocs({
	dir: "content/docs",
});

export default defineConfig({
	mdxOptions: {
		remarkPlugins: [
			remarkInstall,
			[remarkDocGen, { generators: [fileGenerator()] }],
		],
	},
});
