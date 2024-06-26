import { z } from "zod";
import type { Comment, AuthInfo, Awaitable } from "../types";
import { contentSchema } from "./content";

export const sortSchema = z.enum(["oldest", "newest"]).default("newest");

export const postBodySchema = z.strictObject({
  content: contentSchema,
  thread: z.number().optional(),
  page: z.string().max(255).optional(),
});

interface GetCommentsOptions {
  /**
   * Fetch comments after a specific timestamp
   */
  before?: Date;

  /**
   * Count to fetch
   */
  limit: number;

  sort: z.infer<typeof sortSchema>;
  auth?: AuthInfo;
  page?: string;
  thread?: string;
}

interface PostCommentOptions {
  auth: AuthInfo;
  body: z.infer<typeof postBodySchema>;
}

export interface CommentsRoute {
  getComments: (options: GetCommentsOptions) => Awaitable<Comment[]>;
  postComment: (options: PostCommentOptions) => Awaitable<Comment>;
}
