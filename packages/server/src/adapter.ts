import { type z } from "zod";
import type { AuthInfo, Awaitable, Comment, Role } from "./types";
import {
  type updateCommentSchema,
  type postCommentSchema,
  type setRateSchema,
  type sortSchema,
} from "./custom/schemas";

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
  page: string;

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
}
