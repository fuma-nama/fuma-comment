import { z } from "zod";
import type { AuthInfo, Awaitable } from "../types";

export const patchBodySchema = z.strictObject({
  content: z
    .string()
    .trim()
    .min(1)
    .max(2000, "Comments can't be longer than 2000 characters"),
});

interface UpdateCommentOptions {
  id: string;
  auth: AuthInfo;
  body: z.infer<typeof patchBodySchema>;
}

interface DeleteCommentOptions {
  id: string;
  auth: AuthInfo;
}

export interface CommentRoute {
  updateComment: (options: UpdateCommentOptions) => Awaitable<void>;
  deleteComment: (options: DeleteCommentOptions) => Awaitable<void>;
}
