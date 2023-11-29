import { z } from "zod";
import type { AuthInfo, Awaitable } from "../types";
import { contentSchema } from "./content";

export const patchBodySchema = z.strictObject({
  content: contentSchema,
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
