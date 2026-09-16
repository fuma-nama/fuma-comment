import { Demo } from "./page.client";

const CONFIG_SNIPPET = `import { NextComment } from "@fuma-comment/server/next";
import { createGithubDiscussionsAdapter } from "@fuma-comment/github-discussions";

const github = createGithubDiscussionsAdapter({
  repo: "owner/name",
  repoId: process.env.GITHUB_REPO_ID!,       // R_...
  categoryId: process.env.GITHUB_CATEGORY_ID!, // DIC_...
  category: "Comments",
  ownerLogins: ["owner"],
  readToken: process.env.GITHUB_READ_TOKEN,
  getToken: (request) => tokenFromYourCookie(request),
});

export const { GET, POST, PATCH, DELETE } = NextComment({
  role: "database",
  mention: { enabled: true },
  ...github,
});`;

const OPTIONS: [string, string, string][] = [
	["repo", "yes", '"owner/name" of the public repo storing the discussions.'],
	["repoId", "yes", "Repository node id (R_...), to open new discussions."],
	["categoryId", "yes", "Discussions category node id (DIC_...) for new threads."],
	[
		"getToken",
		"yes",
		"Resolve the reader's GitHub token from the request (or null when signed out).",
	],
	["category", "no", "Category name; scopes the search that finds a page's discussion."],
	["ownerLogins", "no", 'GitHub logins allowed to moderate (with role: "database").'],
	["readToken", "no", "Server PAT for anonymous reads + opening threads (public_repo)."],
	["pageToTitle", "no", "Map a page to the Discussion title (default: identity)."],
	["pageToUrl", "no", "Map a page to the URL placed in a new discussion's seed body."],
];

const NOTES = [
	"One level of replies, matching GitHub Discussions.",
	"@mention autocomplete uses repository.mentionableUsers; enable it with mention: { enabled: true }.",
	"readToken needs Discussions read + write (a classic public_repo PAT). Without it, signed-out visitors see no comments and own-comment deletes are blocked.",
	"Rich content round-trips through Markdown. What the editor can't represent degrades: headings, lists and quotes become paragraphs, and images without dimensions become links.",
	"A page maps to a Discussion by title, resolved through GitHub's search index. Set pageToTitle to keep those titles unique.",
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section className="flex flex-col gap-3">
			<h2 className="text-lg font-semibold tracking-tight">{title}</h2>
			{children}
		</section>
	);
}

export default function Home() {
	const repo = process.env.GITHUB_REPO;
	const category = process.env.GITHUB_CATEGORY;

	return (
		<main className="mx-auto flex min-h-screen w-full max-w-[820px] flex-col gap-10 px-6 py-16">
			<header className="flex flex-col gap-3">
				<h1 className="text-2xl font-semibold tracking-tight">GitHub Discussions adapter</h1>
				<p className="text-sm opacity-70">
					Store fuma-comment comments in GitHub Discussions, via{" "}
					<code>@fuma-comment/github-discussions</code>. GitHub is the store, the moderation, and
					the identity, so there's no database and no separate auth. This page is both the docs and
					a live demo
					{repo ? (
						<>
							{" "}
							running against <code>{repo}</code>
							{category ? (
								<>
									{" "}
									in <strong>{category}</strong>
								</>
							) : null}
						</>
					) : null}
					.
				</p>
			</header>

			<Section title="Try it">
				<p className="text-sm opacity-70">
					Sign in with your GitHub account to post; replies and 👍 / 👎 reactions work too, and
					whatever you post shows up on the GitHub discussion.
					{repo ? (
						<>
							{" "}
							<a
								className="underline underline-offset-4"
								href={`https://github.com/${repo}/discussions`}
								target="_blank"
								rel="noreferrer"
							>
								See the discussions on GitHub →
							</a>
						</>
					) : null}
				</p>
				<Demo />
			</Section>

			<Section title="Configure">
				<p className="text-sm opacity-70">
					<code>createGithubDiscussionsAdapter</code> returns both <code>storage</code> and{" "}
					<code>auth</code>, so spread it into <code>NextComment</code>. It's auth-agnostic: you
					only supply <code>getToken</code> (how to read the reader's GitHub token). This example
					ships a reference OAuth flow in <code>lib/github-oauth.ts</code> that stores the token in
					an httpOnly, encrypted cookie.
				</p>
				<pre className="overflow-x-auto rounded-lg border border-black/10 bg-black/[0.03] p-4 text-xs leading-relaxed dark:border-white/10 dark:bg-white/[0.04]">
					<code>{CONFIG_SNIPPET}</code>
				</pre>
			</Section>

			<Section title="Options">
				<div className="overflow-x-auto">
					<table className="w-full text-left text-sm">
						<thead className="opacity-60">
							<tr>
								<th className="py-2 pr-4 font-medium">Option</th>
								<th className="py-2 pr-4 font-medium">Required</th>
								<th className="py-2 font-medium">Description</th>
							</tr>
						</thead>
						<tbody>
							{OPTIONS.map(([name, required, desc]) => (
								<tr key={name} className="border-t border-black/5 align-top dark:border-white/10">
									<td className="py-2 pr-4">
										<code>{name}</code>
									</td>
									<td className="py-2 pr-4 opacity-70">{required}</td>
									<td className="py-2 opacity-70">{desc}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</Section>

			<Section title="Notes">
				<ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm opacity-70">
					{NOTES.map((n) => (
						<li key={n}>{n}</li>
					))}
				</ul>
			</Section>
		</main>
	);
}
