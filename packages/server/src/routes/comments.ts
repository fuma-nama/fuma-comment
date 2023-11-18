import { z } from "zod";
import type { Comment, AuthInfo, Awaitable } from "../types";

export const sortSchema = z.enum(["oldest", "newest"]).default("newest");

export const postBodySchema = z.strictObject({
  content: z
    .string()
    .trim()
    .min(1)
    .max(2000, "Comments can't be longer than 2000 characters"),
  thread: z.number().optional(),
  page: z.string().max(255).optional(),
});

interface GetCommentsOptions {
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
  postComment: (options: PostCommentOptions) => Awaitable<void>;
}
