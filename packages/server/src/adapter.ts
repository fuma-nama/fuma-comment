import type { z } from "zod";
import type {
	AuthInfo,
	AuthInfoWithRole,
	Awaitable,
	Comment,
	Role,
	UserProfile,
} from "./types";
import type {
	updateCommentSchema,
	postCommentSchema,
	setRateSchema,
	sortSchema,
} from "./custom/schemas";
import type { CustomRequest } from "./custom";

interface SetRateOptions {
	/** Comment ID */
	id: string;
	page: string;

	auth: AuthInfo;
	body: z.infer<typeof setRateSchema>;
}

interface DeleteRateOptions {
	/** Comment ID */
	id: string;
	page: string;

	auth: AuthInfo;
}

interface UpdateCommentOptions {
	id: string;
	page: string;

	auth: AuthInfo;
	body: z.infer<typeof updateCommentSchema>;
}

interface DeleteCommentOptions {
	id: string;
	page: string;

	auth: AuthInfo;
}

interface PostCommentOptions {
	auth: AuthInfo;
	body: z.infer<typeof postCommentSchema>;
	page: string;
}

interface GetCommentsOptions {
	/**
	 * Fetch comments after a specific timestamp
	 */
	after?: Date;

	/**
	 * Fetch comments before a specific timestamp
	 */
	before?: Date;

	/**
	 * Count to fetch
	 */
	limit: number;

	sort: z.infer<typeof sortSchema>;
	page?: string;

	auth?: AuthInfo;
	thread?: string;
}

interface GetRoleOptions {
	/**
	 * User info
	 */
	auth: AuthInfo;

	page: string;
}

interface GetCommentOptions {
	/**
	 * Comment ID
	 */
	id: string;
}

export interface StorageAdapter {
	updateComment: (options: UpdateCommentOptions) => Awaitable<void>;
	deleteComment: (options: DeleteCommentOptions) => Awaitable<void>;

	/**
	 * Get the user ID of comment author
	 */
	getCommentAuthor: (options: GetCommentOptions) => Awaitable<string | null>;
	getComments: (options: GetCommentsOptions) => Awaitable<Comment[]>;
	postComment: (options: PostCommentOptions) => Awaitable<Comment>;
	setRate: (options: SetRateOptions) => Awaitable<void>;
	deleteRate: (options: DeleteRateOptions) => Awaitable<void>;

	getRole: (options: GetRoleOptions) => Awaitable<Role | null>;

	queryUsers?: (options: {
		name: string;
		page: string;

		/**
		 * Max count of results
		 */
		limit: number;
	}) => Awaitable<UserProfile[]>;
}

export interface AuthAdapter<R extends CustomRequest> {
	/** Get user session */
	getSession: (request: R) => Awaitable<AuthInfo | null>;

	/** Get user session with role information */
	getSessionWithRole?: (
		request: R,
		options: {
			page: string;
		},
	) => Awaitable<AuthInfoWithRole | null>;
}

export interface StorageAuthProvider
	extends Pick<StorageAdapter, "queryUsers"> {
	/**
	 * Manually join User table after selecting comments
	 */
	getUsers: (userIds: string[]) => UserProfile[] | Promise<UserProfile[]>;
}
