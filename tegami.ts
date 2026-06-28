import { tegami } from "tegami";
import { createCli } from "tegami/cli";
import { github } from "tegami/plugins/github";
import { x } from "tinyexec";

const paper = tegami({
	plugins: [
		github({
			repo: "fuma-nama/fuma-comment",
			versionPr: {
				base: "main",
			},
		}),
		{
			name: "build",
			async willPublish({ pkg }) {
				await x("pnpm", ["turbo", "run", "build", `--filter=${pkg.name}`], {
					throwOnError: true,
				});
			},
		},
	],
	ignore: [/^example-/, "docs", "root", "tsconfig"],
	groups: {
		"fuma-comment": {
			syncBump: true,
			syncGitTag: true,
		},
	},
	packages: {
		"@fuma-comment/server": { group: "fuma-comment" },
		"@fuma-comment/react": { group: "fuma-comment" },
		"@fuma-comment/next": { group: "fuma-comment" },
	},
});

void createCli(paper).parseAsync();
