import { ZodError } from "zod";
import * as comments from "../routes/comments";
import * as rates from "../routes/rates";
import * as comment from "../routes/comment";
import type { StorageAdapter, AuthInfo, Awaitable } from "../types";
import { RouteError } from "../errors";

export interface CustomRequest {
  /** Get user session */
  getSession: () => Awaitable<AuthInfo | null>;

  /** Get body (to JSON) */
  body: () => Awaitable<unknown>;

  /** Query parameters */
  queryParams: Map<string, string>;

  /** Path parameters */
  params: Map<string, string>;
}

export type CustomResponse =
  | {
      type: "success";
      data: object;
    }
  | {
      type: "error";
      status: number;
      data: {
        message: string;
        info?: object;
      };
    };

type RouteHandler = (req: CustomRequest) => Promise<CustomResponse>;

export interface CustomCommentRouter {
  "GET /api/comments": RouteHandler;
  "POST /api/comments": RouteHandler;
  "PATCH /api/comments/[id]": RouteHandler;
  "DELETE /api/comments/[id]": RouteHandler;
  "POST /api/comments/[id]/rate": RouteHandler;
  "DELETE /api/comments/[id]/rate": RouteHandler;
}

export interface CustomCommentOptions {
  adapter: StorageAdapter;
}

const INVALID_PARAM: CustomResponse = {
  type: "error",
  status: 400,
  data: {
    message: "Invalid Parameters",
  },
};

const NOT_AUTHORIZED: CustomResponse = {
  type: "error",
  status: 401,
  data: {
    message: "Not Authorized",
  },
};

export function CustomComment({
  adapter,
}: CustomCommentOptions): CustomCommentRouter {
  return {
    "GET /api/comments": handleError(async ({ getSession, queryParams }) => {
      const auth = (await getSession()) ?? undefined;
      const sort = comments.sortSchema.parse(
        queryParams.get("sort") ?? undefined,
      );
      const before = queryParams.get("before");
      const limit = Math.min(50, Number(queryParams.get("limit") ?? 40));
      const page = queryParams.get("page") ?? undefined;
      const thread = queryParams.get("thread") ?? undefined;

      return {
        type: "success",
        data: await adapter.getComments({
          sort,
          auth,
          thread,
          limit,
          page,
          before: before ? new Date(Number(before)) : undefined,
        }),
      };
    }),
    "POST /api/comments": handleError(async ({ body, getSession }) => {
      const auth = (await getSession()) ?? undefined;
      const content = comments.postBodySchema.parse(await body());
      if (!auth) return NOT_AUTHORIZED;

      return {
        type: "success",
        data: await adapter.postComment({ auth, body: content }),
      };
    }),
    "POST /api/comments/[id]/rate": handleError(
      async ({ body, getSession, params }) => {
        const auth = (await getSession()) ?? undefined;
        const id = params.get("id");
        const content = rates.postBodySchema.parse(await body());
        if (!id) return INVALID_PARAM;
        if (!auth) return NOT_AUTHORIZED;

        await adapter.setRate({ id, auth, body: content });
        return { type: "success", data: { message: "Successful" } };
      },
    ),
    "PATCH /api/comments/[id]": handleError(
      async ({ getSession, body, params }) => {
        const auth = (await getSession()) ?? undefined;
        const id = params.get("id");
        const content = comment.patchBodySchema.parse(await body());
        if (!id) return INVALID_PARAM;
        if (!auth) return NOT_AUTHORIZED;

        await adapter.updateComment({ id, auth, body: content });
        return { type: "success", data: { message: "Successful" } };
      },
    ),
    "DELETE /api/comments/[id]": handleError(async ({ getSession, params }) => {
      const auth = (await getSession()) ?? undefined;
      const id = params.get("id");
      if (!id) return INVALID_PARAM;
      if (!auth) return NOT_AUTHORIZED;

      await adapter.deleteComment({ id, auth });
      return { type: "success", data: { message: "Successful" } };
    }),
    "DELETE /api/comments/[id]/rate": handleError(
      async ({ getSession, params }) => {
        const auth = (await getSession()) ?? undefined;
        const id = params.get("id");
        if (!id) return INVALID_PARAM;
        if (!auth) return NOT_AUTHORIZED;

        await adapter.deleteRate({ id, auth });
        return { type: "success", data: { message: "Successful" } };
      },
    ),
  };

  function handleError(handler: RouteHandler): RouteHandler {
    return async (...args) => {
      try {
        return await handler(...args);
      } catch (e) {
        if (e instanceof RouteError) {
          return {
            type: "error",
            status: e.statusCode,
            data: {
              message: e.message,
            },
          };
        }

        if (e instanceof ZodError) {
          const issuesToString = e.issues
            .map(
              (issue) =>
                `${issue.path[issue.path.length - 1].toString()}: ${issue.message}`,
            )
            .join("\n");

          return {
            type: "error",
            status: 400,
            data: {
              message: issuesToString,
              info: e,
            },
          };
        }

        throw e;
      }
    };
  }
}
