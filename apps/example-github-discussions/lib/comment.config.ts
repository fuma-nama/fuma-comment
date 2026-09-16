import { createGithubDiscussionsAdapter } from "@fuma-comment/github-discussions";
import { getTokenFromRequest } from "./github-oauth";

/** The GitHub Discussions adapter (storage + auth), wired from env. Spread into `NextComment`. */
export const github = createGithubDiscussionsAdapter({
	repo: process.env.GITHUB_REPO ?? "",
	repoId: process.env.GITHUB_REPO_ID ?? "",
	categoryId: process.env.GITHUB_CATEGORY_ID ?? "",
	category: process.env.GITHUB_CATEGORY,
	ownerLogins: process.env.GITHUB_OWNER ? [process.env.GITHUB_OWNER] : [],
	readToken: process.env.GITHUB_READ_TOKEN,
	getToken: getTokenFromRequest,
});
