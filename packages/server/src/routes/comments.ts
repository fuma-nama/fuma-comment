import { z } from "zod";
import type { Comment } from "..";
import type { AuthInfo, RouteResponse } from "./types";

const sortSchema = z.enum(["oldest", "newest"]).default("newest");

const postBodySchema = z.strictObject({
  content: z.string().trim().min(1),
  thread: z.string().optional(),
});

interface GetCommentsOptions {
  sort: z.infer<typeof sortSchema>;
  auth?: AuthInfo;
  thread?: string;
}

interface PostCommentOptions {
  auth: AuthInfo;
  body: z.infer<typeof postBodySchema>;
}

export interface CommentsRoute {
  getComments: (options: GetCommentsOptions) => RouteResponse<Comment[]>;
  postComment: (options: PostCommentOptions) => RouteResponse<void>;
}
