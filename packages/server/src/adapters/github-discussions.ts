import { marked, type Token, type Tokens } from "marked";

import type { AuthAdapter, StorageAdapter } from "../adapter";
import type { CustomRequest } from "../custom";
import type { AuthInfo, Awaitable, Comment, UserProfile } from "../types";

/**
 * Store comments in **GitHub Discussions**. This adapter is both the storage AND the auth provider:
 * GitHub is the store, the moderation, and the identity, so there's no database and no separate user
 * table. Readers comment as their own GitHub account (you supply their token via `getToken`); anonymous
 * reads and new-thread creation use a server `readToken`.
 *
 * ```ts
 * import { createGithubDiscussionsAdapter } from "@fuma-comment/server/adapters/github-discussions";
 *
 * const github = createGithubDiscussionsAdapter({
 *   repo: "owner/name",
 *   repoId: process.env.GH_REPO_ID!,        // R_...
 *   categoryId: process.env.GH_CATEGORY_ID!, // DIC_...
 *   category: "Comments",
 *   ownerLogins: ["owner"],
 *   readToken: process.env.GH_READ_TOKEN,
 *   getToken: (req) => tokenFromYourCookie(req),
 * });
 *
 * export const { GET, POST, PATCH, DELETE } = NextComment({
 *   role: "database",
 *   mention: { enabled: true },
 *   ...github,
 * });
 * ```
 */
export interface GithubDiscussionsOptions {
	/** `"owner/name"` of the public repo whose Discussions store the comments. */
	repo: string;
	/** Repository node id (`R_...`), required to open new discussions. */
	repoId: string;
	/** Discussions category node id (`DIC_...`) that new per-page threads are opened in. */
	categoryId: string;
	/** Category name — scopes the search that finds a page's discussion. Recommended. */
	category?: string;
	/** GitHub logins allowed to moderate (delete/edit any comment) when `role` is enabled. */
	ownerLogins?: string[];
	/**
	 * A server token (GitHub PAT) for anonymous reads, comment-author lookup, and opening new threads.
	 * Needs Discussions read + write on the repo (a classic `public_repo` PAT works). Without it,
	 * signed-out visitors see no comments and own-comment deletes are blocked.
	 */
	readToken?: string;
	/** Map a `page` to the Discussion title (one discussion per page). Default: identity. */
	pageToTitle?: (page: string) => string;
	/** URL placed in a new discussion's seed body. */
	pageToUrl?: (page: string) => string;
	/**
	 * Resolve the signed-in reader's GitHub access token from the request (e.g. read + decrypt your
	 * auth cookie). Return `null` when signed out. This is the only auth wiring the adapter needs; how
	 * the token gets there (an OAuth flow) is up to you — see the `github-discussions` example.
	 */
	getToken: (request: CustomRequest) => Awaitable<string | null>;
}

/** `AuthInfo` with the reader's GitHub token attached, so the storage methods can act as them. */
interface GithubAuthInfo extends AuthInfo {
	token: string;
}

// ── GitHub Discussions GraphQL ──────────────────────────────────────────────────────────────────

const GITHUB_GRAPHQL = "https://api.github.com/graphql";

interface GReactionGroup {
	content: string;
	reactors?: { totalCount: number };
	viewerHasReacted: boolean;
}

interface GComment {
	id: string;
	body: string;
	createdAt: string;
	deletedAt: string | null;
	isMinimized: boolean;
	author: { login: string; avatarUrl: string } | null;
	reactionGroups: GReactionGroup[];
	replyTo?: { id: string } | null;
	replies?: { totalCount: number; nodes: GComment[] };
}

interface GDiscussion {
	id: string;
	title: string;
	comments: { nodes: GComment[] };
}

type ReactionContent = "THUMBS_UP" | "THUMBS_DOWN";

async function gql<T>(query: string, variables: Record<string, unknown>, token: string): Promise<T> {
	const res = await fetch(GITHUB_GRAPHQL, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
			"User-Agent": "fuma-comment-github-discussions",
		},
		body: JSON.stringify({ query, variables }),
		cache: "no-store",
	});
	if (!res.ok) throw new Error(`GitHub GraphQL ${res.status}: ${await res.text()}`);
	const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
	if (json.errors?.length) {
		throw new Error(`GitHub GraphQL: ${json.errors.map((e) => e.message).join("; ")}`);
	}
	if (!json.data) throw new Error("GitHub GraphQL: empty response");
	return json.data;
}

const COMMENT_FIELDS = `
	id
	body
	createdAt
	deletedAt
	isMinimized
	author { login avatarUrl }
	reactionGroups { content viewerHasReacted reactors { totalCount } }
`;

const DISCUSSION_FIELDS = `
	id
	title
	comments(first: 100) {
		nodes {
			${COMMENT_FIELDS}
			replies(first: 100) { totalCount nodes { ${COMMENT_FIELDS} replyTo { id } } }
		}
	}
`;

function createClient(options: GithubDiscussionsOptions) {
	const [owner = "", name = ""] = options.repo.split("/");

	async function findDiscussion(term: string, token: string): Promise<GDiscussion | null> {
		const categoryQuery = options.category ? `category:${JSON.stringify(options.category)}` : "";
		const query = `repo:${options.repo.toLowerCase()} ${categoryQuery} in:title ${JSON.stringify(term)}`;
		const data = await gql<{ search: { nodes: (GDiscussion | Record<string, never>)[] } }>(
			`query ($query: String!) {
				search(type: DISCUSSION, first: 10, query: $query) {
					nodes { ... on Discussion { ${DISCUSSION_FIELDS} } }
				}
			}`,
			{ query },
			token,
		);
		return data.search.nodes.find((n): n is GDiscussion => "title" in n && n.title === term) ?? null;
	}

	async function createDiscussion(title: string, token: string): Promise<GDiscussion> {
		const url = options.pageToUrl?.(title);
		const body = `Comment thread for ${url ? `[${title}](${url})` : `\`${title}\``}. Managed by fuma-comment.`;
		const data = await gql<{ createDiscussion: { discussion: GDiscussion } }>(
			`mutation ($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
				createDiscussion(input: { repositoryId: $repositoryId, categoryId: $categoryId, title: $title, body: $body }) {
					discussion { ${DISCUSSION_FIELDS} }
				}
			}`,
			{ repositoryId: options.repoId, categoryId: options.categoryId, title, body },
			token,
		);
		return data.createDiscussion.discussion;
	}

	async function addComment(
		discussionId: string,
		body: string,
		token: string,
		replyToId?: string,
	): Promise<GComment> {
		const data = await gql<{ addDiscussionComment: { comment: GComment } }>(
			`mutation ($discussionId: ID!, $body: String!, $replyToId: ID) {
				addDiscussionComment(input: { discussionId: $discussionId, body: $body, replyToId: $replyToId }) {
					comment { ${COMMENT_FIELDS} replyTo { id } replies(first: 100) { totalCount nodes { id } } }
				}
			}`,
			{ discussionId, body, replyToId: replyToId ?? null },
			token,
		);
		return data.addDiscussionComment.comment;
	}

	async function updateComment(commentId: string, body: string, token: string): Promise<void> {
		await gql(
			`mutation ($commentId: ID!, $body: String!) {
				updateDiscussionComment(input: { commentId: $commentId, body: $body }) { comment { id } }
			}`,
			{ commentId, body },
			token,
		);
	}

	async function deleteComment(commentId: string, token: string): Promise<void> {
		await gql(
			`mutation ($id: ID!) { deleteDiscussionComment(input: { id: $id }) { comment { id } } }`,
			{ id: commentId },
			token,
		);
	}

	async function setReaction(
		subjectId: string,
		content: ReactionContent,
		mode: "add" | "remove",
		token: string,
	): Promise<void> {
		await gql(
			`mutation ($subjectId: ID!, $content: ReactionContent!) {
				${mode}Reaction(input: { subjectId: $subjectId, content: $content }) { clientMutationId }
			}`,
			{ subjectId, content },
			token,
		);
	}

	async function getViewerReactions(
		commentId: string,
		token: string,
	): Promise<{ up: boolean; down: boolean }> {
		const data = await gql<{
			node: { reactionGroups?: { content: string; viewerHasReacted: boolean }[] } | null;
		}>(
			`query ($id: ID!) { node(id: $id) { ... on DiscussionComment { reactionGroups { content viewerHasReacted } } } }`,
			{ id: commentId },
			token,
		);
		const groups = data.node?.reactionGroups ?? [];
		const has = (c: string) => groups.find((g) => g.content === c)?.viewerHasReacted ?? false;
		return { up: has("THUMBS_UP"), down: has("THUMBS_DOWN") };
	}

	async function getViewerLogin(token: string): Promise<string | null> {
		const data = await gql<{ viewer: { login: string } | null }>(
			`query { viewer { login } }`,
			{},
			token,
		);
		return data.viewer?.login ?? null;
	}

	async function getCommentAuthor(commentId: string, token: string): Promise<string | null> {
		const data = await gql<{ node: { author?: { login: string } | null } | null }>(
			`query ($id: ID!) { node(id: $id) { ... on DiscussionComment { author { login } } } }`,
			{ id: commentId },
			token,
		);
		return data.node?.author?.login ?? null;
	}

	async function mentionableUsers(
		query: string,
		first: number,
		token: string,
	): Promise<{ login: string; avatarUrl: string }[]> {
		const data = await gql<{
			repository: { mentionableUsers: { nodes: { login: string; avatarUrl: string }[] } } | null;
		}>(
			`query ($owner: String!, $name: String!, $query: String!, $first: Int!) {
				repository(owner: $owner, name: $name) {
					mentionableUsers(first: $first, query: $query) { nodes { login avatarUrl } }
				}
			}`,
			{ owner, name, query, first },
			token,
		);
		return data.repository?.mentionableUsers.nodes ?? [];
	}

	return {
		findDiscussion,
		createDiscussion,
		addComment,
		updateComment,
		deleteComment,
		setReaction,
		getViewerReactions,
		getViewerLogin,
		getCommentAuthor,
		mentionableUsers,
	};
}

// ── Content bridge: editor doc (tiptap) <-> GitHub Markdown ──────────────────────────────────────

interface JSONContent {
	type?: string;
	text?: string;
	marks?: { type: string; attrs?: Record<string, unknown> }[];
	attrs?: Record<string, unknown>;
	content?: JSONContent[];
}

function escapeText(text: string): string {
	return text.replace(/([\\`*_~])/g, "\\$1");
}

function inlineToMarkdown(node: JSONContent): string {
	if (node.type === "text") {
		const marks = node.marks ?? [];
		const has = (t: string) => marks.some((m) => m.type === t);
		if (has("code")) return "`" + (node.text ?? "").replace(/`/g, "") + "`";

		let text = escapeText(node.text ?? "");
		if (has("bold")) text = `**${text}**`;
		if (has("italic")) text = `_${text}_`;
		if (has("strike")) text = `~~${text}~~`;
		const link = marks.find((m) => m.type === "link");
		const href = link?.attrs?.href;
		if (typeof href === "string" && href) text = `[${text}](${href})`;
		return text;
	}
	// A mention's `id` is the GitHub login, which is what GitHub links (not the display-name label).
	if (node.type === "mention") {
		const a = node.attrs ?? {};
		return `@${(a.id as string) ?? (a.label as string) ?? ""}`;
	}
	if (node.type === "image") {
		const a = node.attrs ?? {};
		return `![${(a.alt as string) ?? ""}](${(a.src as string) ?? ""})`;
	}
	if (node.type === "hardBreak") return "\n";
	return (node.content ?? []).map(inlineToMarkdown).join("");
}

function blockToMarkdown(node: JSONContent): string {
	switch (node.type) {
		case "paragraph":
			return (node.content ?? []).map(inlineToMarkdown).join("");
		case "codeBlock": {
			const lang = (node.attrs?.language as string) ?? "";
			const code = (node.content ?? []).map((c) => c.text ?? "").join("");
			return "```" + lang + "\n" + code + "\n```";
		}
		case "image":
			return inlineToMarkdown(node);
		default:
			return (node.content ?? []).map(blockToMarkdown).join("\n\n");
	}
}

/** Serialize the editor's content (a tiptap doc) to GitHub-flavored Markdown. */
function contentToMarkdown(doc: JSONContent): string {
	if (!doc || doc.type !== "doc") return "";
	return (doc.content ?? [])
		.map(blockToMarkdown)
		.join("\n\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

function textNode(value: string, marks?: JSONContent["marks"]): JSONContent {
	return marks && marks.length ? { type: "text", text: value, marks } : { type: "text", text: value };
}

function withMark(
	nodes: JSONContent[],
	mark: { type: string; attrs?: Record<string, unknown> },
): JSONContent[] {
	return nodes.map((n) => (n.type === "text" ? { ...n, marks: [...(n.marks ?? []), mark] } : n));
}

// A GitHub @mention: preceded by start/whitespace/"(" (so emails like a@b don't match), a valid-ish login.
const MENTION_RE = /(?<=^|[\s(])@([a-zA-Z\d](?:-?[a-zA-Z\d]){0,38})/g;

function splitMentions(value: string): JSONContent[] {
	const out: JSONContent[] = [];
	let last = 0;
	let m: RegExpExecArray | null;
	MENTION_RE.lastIndex = 0;
	while ((m = MENTION_RE.exec(value)) !== null) {
		if (m.index > last) out.push(textNode(value.slice(last, m.index)));
		out.push({ type: "mention", attrs: { id: m[1], label: m[1] } });
		last = m.index + m[0].length;
	}
	if (last < value.length) out.push(textNode(value.slice(last)));
	return out.length ? out : [textNode(value)];
}

function inlineFromTokens(tokens: Token[] | undefined): JSONContent[] {
	const out: JSONContent[] = [];
	for (const tok of tokens ?? []) {
		switch (tok.type) {
			case "text": {
				const t = tok as Tokens.Text;
				if (t.tokens && t.tokens.length) out.push(...inlineFromTokens(t.tokens));
				else out.push(...splitMentions(t.text));
				break;
			}
			case "escape":
				out.push(textNode((tok as Tokens.Escape).text));
				break;
			case "strong":
				out.push(...withMark(inlineFromTokens((tok as Tokens.Strong).tokens), { type: "bold" }));
				break;
			case "em":
				out.push(...withMark(inlineFromTokens((tok as Tokens.Em).tokens), { type: "italic" }));
				break;
			case "del":
				out.push(...withMark(inlineFromTokens((tok as Tokens.Del).tokens), { type: "strike" }));
				break;
			case "codespan":
				out.push(textNode((tok as Tokens.Codespan).text, [{ type: "code" }]));
				break;
			case "link": {
				const l = tok as Tokens.Link;
				out.push(...withMark(inlineFromTokens(l.tokens), { type: "link", attrs: { href: l.href } }));
				break;
			}
			case "image": {
				const im = tok as Tokens.Image;
				out.push({ type: "image", attrs: { src: im.href, alt: im.text ?? "" } });
				break;
			}
			case "br":
				out.push({ type: "hardBreak" });
				break;
			case "html":
				out.push(textNode((tok as Tokens.HTML).text.replace(/<[^>]*>/g, "")));
				break;
			default: {
				const raw = (tok as { raw?: string }).raw;
				if (raw) out.push(textNode(raw));
			}
		}
	}
	return out;
}

function paragraph(content: JSONContent[]): JSONContent {
	return { type: "paragraph", content };
}

function blocksFromTokens(tokens: Token[]): JSONContent[] {
	const out: JSONContent[] = [];
	for (const tok of tokens) {
		switch (tok.type) {
			case "paragraph":
				out.push(paragraph(inlineFromTokens((tok as Tokens.Paragraph).tokens)));
				break;
			case "text": {
				const t = tok as Tokens.Text;
				out.push(paragraph(t.tokens ? inlineFromTokens(t.tokens) : splitMentions(t.text)));
				break;
			}
			case "code": {
				const c = tok as Tokens.Code;
				out.push({
					type: "codeBlock",
					attrs: { language: c.lang || null },
					content: c.text ? [textNode(c.text)] : [],
				});
				break;
			}
			case "heading":
				out.push(paragraph(withMark(inlineFromTokens((tok as Tokens.Heading).tokens), { type: "bold" })));
				break;
			case "blockquote":
				for (const inner of blocksFromTokens((tok as Tokens.Blockquote).tokens)) out.push(inner);
				break;
			case "list": {
				const list = tok as Tokens.List;
				let n = typeof list.start === "number" && list.start ? list.start : 1;
				for (const item of list.items) {
					const marker = list.ordered ? `${n++}. ` : "• ";
					out.push(paragraph([textNode(marker), ...inlineFromTokens(item.tokens)]));
				}
				break;
			}
			case "hr":
			case "space":
				break;
			case "html":
				out.push(paragraph([textNode((tok as Tokens.HTML).text.replace(/<[^>]*>/g, "").trim())]));
				break;
			default: {
				const raw = (tok as { raw?: string }).raw?.trim();
				if (raw) out.push(paragraph([textNode(raw)]));
			}
		}
	}
	return out.filter((b) => b.type !== "paragraph" || (b.content?.length ?? 0) > 0);
}

/** Parse a comment's Markdown back into the editor's content doc. Unsupported blocks degrade to paragraphs. */
function markdownToContent(md: string): JSONContent {
	const content = blocksFromTokens(marked.lexer(md ?? ""));
	return { type: "doc", content: content.length ? content : [paragraph([])] };
}

// ── Mapping GitHub comments -> fuma-comment `Comment` ─────────────────────────────────────────────

function reaction(c: GComment, content: ReactionContent) {
	const g = c.reactionGroups?.find((r) => r.content === content);
	return { count: g?.reactors?.totalCount ?? 0, viewer: g?.viewerHasReacted ?? false };
}

function mapComment(c: GComment, page: string, opts: { threadId?: string; authed: boolean }): Comment {
	const up = reaction(c, "THUMBS_UP");
	const down = reaction(c, "THUMBS_DOWN");
	return {
		id: c.id,
		threadId: opts.threadId ?? c.replyTo?.id ?? undefined,
		page,
		author: {
			id: c.author?.login ?? "ghost",
			name: c.author?.login ?? "ghost",
			image: c.author?.avatarUrl,
		},
		content: markdownToContent(c.body),
		likes: up.count,
		dislikes: down.count,
		replies: c.replies?.totalCount ?? 0,
		timestamp: new Date(c.createdAt),
		// Only trust viewer reaction flags when the request carried the reader's own token.
		liked: opts.authed ? (up.viewer ? true : down.viewer ? false : undefined) : undefined,
	};
}

const visible = (c: GComment) => !c.deletedAt && !c.isMinimized;

// ── The adapter ─────────────────────────────────────────────────────────────────────────────────

export function createGithubDiscussionsAdapter(options: GithubDiscussionsOptions): {
	storage: StorageAdapter;
	auth: AuthAdapter<CustomRequest>;
} {
	const client = createClient(options);
	const titleOf = options.pageToTitle ?? ((p: string) => p);
	const tokenOf = (auth: unknown) => (auth as GithubAuthInfo | undefined)?.token;

	// Best-effort token -> login cache so a burst of reads doesn't hit the viewer endpoint every time.
	const loginCache = new Map<string, { login: string; exp: number }>();
	async function resolveLogin(token: string): Promise<string | null> {
		const hit = loginCache.get(token);
		if (hit && hit.exp > Date.now()) return hit.login;
		const login = await client.getViewerLogin(token);
		if (login) loginCache.set(token, { login, exp: Date.now() + 5 * 60 * 1000 });
		return login;
	}

	async function findOrCreate(page: string, userToken: string): Promise<string> {
		const title = titleOf(page);
		const existing = await client.findDiscussion(title, userToken);
		if (existing) return existing.id;
		// Open the container with the server token when available (so a category that restricts who may
		// START a thread still works; any signed-in user can COMMENT on an existing one), else the user's.
		const createToken = options.readToken || userToken;
		try {
			return (await client.createDiscussion(title, createToken)).id;
		} catch (err) {
			if (createToken === userToken) throw err;
			return (await client.createDiscussion(title, userToken)).id;
		}
	}

	const storage: StorageAdapter = {
		async getComments({ page, thread, sort, before, after, limit, auth }) {
			if (typeof page !== "string") return [];
			const userToken = tokenOf(auth);
			const token = userToken || options.readToken;
			if (!token) return [];
			const discussion = await client.findDiscussion(titleOf(page), token);
			if (!discussion) return [];

			const top = discussion.comments.nodes.filter(visible);
			let list: Comment[];
			if (thread) {
				const parent = top.find((c) => c.id === thread);
				list = (parent?.replies?.nodes ?? [])
					.filter(visible)
					.map((r) => mapComment(r, page, { threadId: thread, authed: Boolean(userToken) }));
			} else {
				list = top.map((c) => mapComment(c, page, { authed: Boolean(userToken) }));
			}

			list.sort((a, b) =>
				sort === "oldest"
					? a.timestamp.getTime() - b.timestamp.getTime()
					: b.timestamp.getTime() - a.timestamp.getTime(),
			);
			if (before) list = list.filter((c) => c.timestamp.getTime() < before.getTime());
			if (after) list = list.filter((c) => c.timestamp.getTime() > after.getTime());
			return list.slice(0, limit);
		},

		async postComment({ auth, body, page }) {
			const token = tokenOf(auth);
			if (!token) throw new Error("Missing GitHub token");
			const discussionId = await findOrCreate(page, token);
			const comment = await client.addComment(
				discussionId,
				contentToMarkdown(body.content as JSONContent),
				token,
				body.thread,
			);
			return mapComment(comment, page, { threadId: body.thread, authed: true });
		},

		async updateComment({ id, auth, body }) {
			const token = tokenOf(auth);
			if (!token) throw new Error("Missing GitHub token");
			await client.updateComment(id, contentToMarkdown(body.content as JSONContent), token);
		},

		async deleteComment({ id, auth }) {
			const token = tokenOf(auth);
			if (!token) throw new Error("Missing GitHub token");
			await client.deleteComment(id, token);
		},

		async setRate({ id, auth, body }) {
			const token = tokenOf(auth);
			if (!token) throw new Error("Missing GitHub token");
			// A like/dislike is exclusive; read current state and make only real transitions (removing a
			// reaction the viewer lacks errors on GitHub).
			const state = await client.getViewerReactions(id, token);
			if (body.like) {
				if (!state.up) await client.setReaction(id, "THUMBS_UP", "add", token);
				if (state.down) await client.setReaction(id, "THUMBS_DOWN", "remove", token);
			} else {
				if (!state.down) await client.setReaction(id, "THUMBS_DOWN", "add", token);
				if (state.up) await client.setReaction(id, "THUMBS_UP", "remove", token);
			}
		},

		async deleteRate({ id, auth }) {
			const token = tokenOf(auth);
			if (!token) throw new Error("Missing GitHub token");
			const state = await client.getViewerReactions(id, token);
			if (state.up) await client.setReaction(id, "THUMBS_UP", "remove", token);
			if (state.down) await client.setReaction(id, "THUMBS_DOWN", "remove", token);
		},

		async getCommentAuthor({ id }) {
			// Called before delete to gate ownership; receives no auth, so use the server token.
			if (!options.readToken) return null;
			return client.getCommentAuthor(id, options.readToken);
		},

		async getRole({ auth }) {
			const owners = (options.ownerLogins ?? []).map((l) => l.toLowerCase());
			return owners.includes(auth.id.toLowerCase())
				? { name: "maintainer", canDelete: true }
				: null;
		},

		async queryUsers({ name, limit }): Promise<UserProfile[]> {
			// @mention autocomplete. Label suggestions with the login (what GitHub links + what gets posted).
			if (!options.readToken || !name) return [];
			const users = await client.mentionableUsers(name, limit, options.readToken);
			return users.map((u) => ({ id: u.login, name: u.login, image: u.avatarUrl }));
		},
	};

	const auth: AuthAdapter<CustomRequest> = {
		async getSession(request) {
			const token = await options.getToken(request);
			if (!token) return null;
			const login = await resolveLogin(token);
			if (!login) return null;
			const session: GithubAuthInfo = { id: login, token };
			return session;
		},
	};

	return { storage, auth };
}
