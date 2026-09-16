import type {
	AuthAdapter,
	AuthInfo,
	Awaitable,
	Comment,
	StorageAdapter,
	UserProfile,
} from "@fuma-comment/server";
import type { CustomRequest } from "@fuma-comment/server/custom";
import { contentToMarkdown, type JSONContent, markdownToContent } from "./markdown";

/**
 * Store comments in **GitHub Discussions**. This adapter is both the storage AND the auth provider:
 * GitHub is the store, the moderation, and the identity, so there's no database and no separate user
 * table. Readers comment as their own GitHub account (you supply their token via `getToken`); anonymous
 * reads and new-thread creation use a server `readToken`.
 *
 * ```ts
 * import { createGithubDiscussionsAdapter } from "@fuma-comment/github-discussions";
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
	/** Map a `page` to the URL placed in a new discussion's seed body. */
	pageToUrl?: (page: string) => string;
	/**
	 * Resolve the signed-in reader's GitHub access token from the request (e.g. read + decrypt your
	 * auth cookie). Return `null` when signed out. This is the only auth wiring the adapter needs; how
	 * the token gets there (an OAuth flow) is up to you — see the `github-discussions` example.
	 */
	getToken: (request: CustomRequest) => Awaitable<string | null>;
}

/**
 * The reader's token rides on the session so the storage methods can act as them. It is keyed by a
 * private symbol: `{ ...auth }` carries it between the route handlers, `JSON.stringify` does not, so it
 * never reaches the browser through `GET /comments/[page]/auth`.
 */
const TOKEN = Symbol("github-token");

interface GithubAuthInfo extends AuthInfo {
	[TOKEN]: string;
}

// ── A bounded, TTL'd cache ───────────────────────────────────────────────────────────────────────

function createCache<T>(max: number, ttl: number) {
	const entries = new Map<string, { value: T; expires: number }>();

	return {
		get(key: string): T | undefined {
			const entry = entries.get(key);
			if (!entry) return;
			entries.delete(key);
			if (entry.expires <= Date.now()) return;
			// Re-inserting moves the key to the end, so the first key is always the least recent.
			entries.set(key, entry);
			return entry.value;
		},
		set(key: string, value: T): void {
			entries.delete(key);
			entries.set(key, { value, expires: Date.now() + ttl });
			if (entries.size > max) entries.delete(entries.keys().next().value as string);
		},
	};
}

// ── GitHub Discussions GraphQL ──────────────────────────────────────────────────────────────────

const GITHUB_GRAPHQL = "https://api.github.com/graphql";
const PAGE_SIZE = 100;
const CACHE_MAX = 500;
const LOGIN_TTL = 5 * 60 * 1000;
const DISCUSSION_TTL = 30 * 60 * 1000;

const RATE_REACTIONS = ["THUMBS_UP", "THUMBS_DOWN"] as const;
type ReactionContent = (typeof RATE_REACTIONS)[number];

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
	replies?: { totalCount: number };
}

interface GConnection {
	pageInfo: {
		hasNextPage: boolean;
		hasPreviousPage: boolean;
		startCursor: string | null;
		endCursor: string | null;
	};
	nodes: GComment[];
}

/** Relay pagination args; exactly one direction is set per call. */
interface PageArgs {
	first?: number;
	last?: number;
	after?: string;
	before?: string;
}

const EMPTY_CONNECTION: GConnection = {
	pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null },
	nodes: [],
};

async function gql<T>(
	query: string,
	variables: Record<string, unknown>,
	token: string,
): Promise<T> {
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

const PAGE_VARS = "$first: Int, $last: Int, $after: String, $before: String";
const PAGE_ARGS = "(first: $first, last: $last, after: $after, before: $before)";
const PAGE_INFO = "pageInfo { hasNextPage hasPreviousPage startCursor endCursor }";

function createClient(options: GithubDiscussionsOptions) {
	const [owner = "", name = ""] = options.repo.split("/");

	async function findDiscussion(title: string, token: string): Promise<string | null> {
		const category = options.category ? `category:${JSON.stringify(options.category)} ` : "";
		const query = `repo:${options.repo.toLowerCase()} ${category}in:title ${JSON.stringify(title)}`;
		const data = await gql<{ search: { nodes: { id?: string; title?: string }[] } }>(
			`query ($query: String!) {
				search(type: DISCUSSION, first: 25, query: $query) {
					nodes { ... on Discussion { id title } }
				}
			}`,
			{ query },
			token,
		);
		return data.search.nodes.find((node) => node.title === title)?.id ?? null;
	}

	async function createDiscussion(
		title: string,
		url: string | undefined,
		token: string,
	): Promise<string> {
		const body = `Comment thread for ${url ? `[${title}](${url})` : `\`${title}\``}. Managed by fuma-comment.`;
		const data = await gql<{ createDiscussion: { discussion: { id: string } } }>(
			`mutation ($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
				createDiscussion(input: { repositoryId: $repositoryId, categoryId: $categoryId, title: $title, body: $body }) {
					discussion { id }
				}
			}`,
			{ repositoryId: options.repoId, categoryId: options.categoryId, title, body },
			token,
		);
		return data.createDiscussion.discussion.id;
	}

	async function listComments(
		discussionId: string,
		args: PageArgs,
		token: string,
	): Promise<GConnection> {
		const data = await gql<{ node: { comments: GConnection } | null }>(
			`query ($id: ID!, ${PAGE_VARS}) {
				node(id: $id) {
					... on Discussion {
						comments${PAGE_ARGS} {
							${PAGE_INFO}
							nodes { ${COMMENT_FIELDS} replies { totalCount } }
						}
					}
				}
			}`,
			{ id: discussionId, ...args },
			token,
		);
		return data.node?.comments ?? EMPTY_CONNECTION;
	}

	async function listReplies(
		commentId: string,
		args: PageArgs,
		token: string,
	): Promise<GConnection> {
		const data = await gql<{ node: { replies: GConnection } | null }>(
			`query ($id: ID!, ${PAGE_VARS}) {
				node(id: $id) {
					... on DiscussionComment {
						replies${PAGE_ARGS} { ${PAGE_INFO} nodes { ${COMMENT_FIELDS} } }
					}
				}
			}`,
			{ id: commentId, ...args },
			token,
		);
		return data.node?.replies ?? EMPTY_CONNECTION;
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
					comment { ${COMMENT_FIELDS} replies { totalCount } }
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

	async function viewerReactions(commentId: string, token: string): Promise<Set<ReactionContent>> {
		const data = await gql<{ node: { reactionGroups?: GReactionGroup[] } | null }>(
			`query ($id: ID!) { node(id: $id) { ... on DiscussionComment { reactionGroups { content viewerHasReacted } } } }`,
			{ id: commentId },
			token,
		);
		const out = new Set<ReactionContent>();
		for (const group of data.node?.reactionGroups ?? []) {
			const content = group.content as ReactionContent;
			if (group.viewerHasReacted && RATE_REACTIONS.includes(content)) out.add(content);
		}
		return out;
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
		listComments,
		listReplies,
		addComment,
		updateComment,
		deleteComment,
		setReaction,
		viewerReactions,
		getViewerLogin,
		getCommentAuthor,
		mentionableUsers,
	};
}

/**
 * Walk a comment connection one page at a time, in the order the caller asked for. GitHub returns
 * connections oldest-first, so `newestFirst` pages backwards from the end.
 */
async function* walk(
	fetchPage: (args: PageArgs) => Promise<GConnection>,
	newestFirst: boolean,
): AsyncGenerator<GComment> {
	let cursor: string | undefined;
	for (;;) {
		const { nodes, pageInfo } = await fetchPage(
			newestFirst ? { last: PAGE_SIZE, before: cursor } : { first: PAGE_SIZE, after: cursor },
		);

		if (newestFirst) {
			for (let i = nodes.length - 1; i >= 0; i--) yield nodes[i];
			if (!pageInfo.hasPreviousPage || !pageInfo.startCursor) return;
			cursor = pageInfo.startCursor;
		} else {
			yield* nodes;
			if (!pageInfo.hasNextPage || !pageInfo.endCursor) return;
			cursor = pageInfo.endCursor;
		}
	}
}

// ── Mapping GitHub comments -> fuma-comment `Comment` ─────────────────────────────────────────────

function reaction(comment: GComment, content: ReactionContent) {
	const group = comment.reactionGroups?.find((item) => item.content === content);
	return { count: group?.reactors?.totalCount ?? 0, viewer: group?.viewerHasReacted ?? false };
}

interface MapOptions {
	page: string;
	threadId?: string;
	/** Whether the request carried the reader's own token, so viewer reaction flags can be trusted. */
	authed: boolean;
}

function mapComment(comment: GComment, options: MapOptions): Comment {
	const up = reaction(comment, "THUMBS_UP");
	const down = reaction(comment, "THUMBS_DOWN");
	return {
		id: comment.id,
		threadId: options.threadId,
		page: options.page,
		author: {
			id: comment.author?.login ?? "ghost",
			name: comment.author?.login ?? "ghost",
			image: comment.author?.avatarUrl,
		},
		content: markdownToContent(comment.body),
		likes: up.count,
		dislikes: down.count,
		replies: comment.replies?.totalCount ?? 0,
		timestamp: new Date(comment.createdAt),
		liked: options.authed ? (up.viewer ? true : down.viewer ? false : undefined) : undefined,
	};
}

const visible = (comment: GComment) => !comment.deletedAt && !comment.isMinimized;

// ── The adapter ─────────────────────────────────────────────────────────────────────────────────

export function createGithubDiscussionsAdapter(options: GithubDiscussionsOptions): {
	storage: StorageAdapter;
	auth: AuthAdapter<CustomRequest>;
} {
	const client = createClient(options);
	const titleOf = options.pageToTitle ?? ((page: string) => page);

	const tokenOf = (auth: AuthInfo | undefined) => (auth as GithubAuthInfo | undefined)?.[TOKEN];
	function requireToken(auth: AuthInfo): string {
		const token = tokenOf(auth);
		if (!token) {
			throw new Error(
				"Missing GitHub token: the GitHub Discussions storage adapter needs its own auth adapter.",
			);
		}
		return token;
	}

	const loginCache = createCache<string>(CACHE_MAX, LOGIN_TTL);
	async function resolveLogin(token: string): Promise<string | null> {
		const cached = loginCache.get(token);
		if (cached) return cached;
		const login = await client.getViewerLogin(token);
		if (login) loginCache.set(token, login);
		return login;
	}

	// Also keeps a burst of writes on a fresh page from racing the search index into duplicate threads.
	const discussionCache = createCache<string>(CACHE_MAX, DISCUSSION_TTL);
	async function findDiscussion(page: string, token: string): Promise<string | null> {
		const cached = discussionCache.get(page);
		if (cached) return cached;
		const id = await client.findDiscussion(titleOf(page), token);
		if (id) discussionCache.set(page, id);
		return id;
	}

	async function findOrCreate(page: string, userToken: string): Promise<string> {
		const existing = await findDiscussion(page, userToken);
		if (existing) return existing;

		// Open the container with the server token when available (so a category that restricts who may
		// START a thread still works; any signed-in user can COMMENT on an existing one), else the user's.
		const title = titleOf(page);
		const url = options.pageToUrl?.(page);
		const token = options.readToken ?? userToken;
		let id: string;
		try {
			id = await client.createDiscussion(title, url, token);
		} catch (err) {
			// Someone else may have opened it in the meantime, or the server token may not be allowed to.
			const raced = await client.findDiscussion(title, userToken);
			if (raced) id = raced;
			else if (token === userToken) throw err;
			else id = await client.createDiscussion(title, url, userToken);
		}
		discussionCache.set(page, id);
		return id;
	}

	/** Drain a walker into the page the route asked for; the walker already yields in sort order. */
	async function collect(
		source: AsyncGenerator<GComment>,
		query: MapOptions & { before?: Date; after?: Date; limit: number },
	): Promise<Comment[]> {
		const before = query.before?.getTime();
		const after = query.after?.getTime();
		const out: Comment[] = [];

		for await (const node of source) {
			if (!visible(node)) continue;
			const time = new Date(node.createdAt).getTime();
			if (before !== undefined && time >= before) continue;
			if (after !== undefined && time <= after) continue;

			out.push(mapComment(node, query));
			if (out.length >= query.limit) break;
		}
		return out;
	}

	const storage: StorageAdapter = {
		async getComments({ page, thread, sort, before, after, limit, auth }) {
			if (typeof page !== "string") return [];
			const userToken = tokenOf(auth);
			const token = userToken ?? options.readToken;
			if (!token) return [];

			const newestFirst = sort !== "oldest";
			const shared = { page, authed: userToken !== undefined, before, after, limit };

			if (thread) {
				const source = walk((args) => client.listReplies(thread, args, token), newestFirst);
				return collect(source, { ...shared, threadId: thread });
			}

			const discussionId = await findDiscussion(page, token);
			if (!discussionId) return [];
			const source = walk((args) => client.listComments(discussionId, args, token), newestFirst);
			return collect(source, shared);
		},

		async postComment({ auth, body, page }) {
			const token = requireToken(auth);
			const discussionId = await findOrCreate(page, token);
			const comment = await client.addComment(
				discussionId,
				contentToMarkdown(body.content as JSONContent),
				token,
				body.thread,
			);
			return mapComment(comment, { page, threadId: body.thread, authed: true });
		},

		async updateComment({ id, auth, body }) {
			const token = requireToken(auth);
			await client.updateComment(id, contentToMarkdown(body.content as JSONContent), token);
		},

		async deleteComment({ id, auth }) {
			await client.deleteComment(id, requireToken(auth));
		},

		async setRate({ id, auth, body }) {
			const token = requireToken(auth);
			// A like/dislike is exclusive, and removing a reaction the viewer lacks errors on GitHub, so
			// read the current state and make only the real transitions.
			const reacted = await client.viewerReactions(id, token);
			const add: ReactionContent = body.like ? "THUMBS_UP" : "THUMBS_DOWN";
			const remove: ReactionContent = body.like ? "THUMBS_DOWN" : "THUMBS_UP";

			await Promise.all([
				reacted.has(add) ? null : client.setReaction(id, add, "add", token),
				reacted.has(remove) ? client.setReaction(id, remove, "remove", token) : null,
			]);
		},

		async deleteRate({ id, auth }) {
			const token = requireToken(auth);
			const reacted = await client.viewerReactions(id, token);
			const jobs: Promise<void>[] = [];
			for (const content of reacted) jobs.push(client.setReaction(id, content, "remove", token));
			await Promise.all(jobs);
		},

		async getCommentAuthor({ id }) {
			// Called before delete to gate ownership; receives no auth, so use the server token.
			if (!options.readToken) return null;
			return client.getCommentAuthor(id, options.readToken);
		},

		async getRole({ auth }) {
			const owners = options.ownerLogins;
			if (!owners?.length) return null;
			const login = auth.id.toLowerCase();
			return owners.some((owner) => owner.toLowerCase() === login)
				? { name: "maintainer", canDelete: true }
				: null;
		},

		async queryUsers({ name, limit }): Promise<UserProfile[]> {
			// @mention autocomplete. Label suggestions with the login (what GitHub links + what gets posted).
			if (!options.readToken || !name) return [];
			const users = await client.mentionableUsers(name, limit, options.readToken);
			return users.map((user) => ({ id: user.login, name: user.login, image: user.avatarUrl }));
		},
	};

	const auth: AuthAdapter<CustomRequest> = {
		async getSession(request) {
			const token = await options.getToken(request);
			if (!token) return null;
			const login = await resolveLogin(token);
			if (!login) return null;
			return { id: login, [TOKEN]: token } satisfies GithubAuthInfo;
		},
	};

	return { storage, auth };
}
