import { ZodError } from "zod";
import type { AuthInfo, AuthInfoWithRole, Awaitable } from "../types";
import { RouteError } from "../errors";
import { type StorageAdapter } from "../adapter";
import {
  postCommentSchema,
  setRateSchema,
  sortSchema,
  updateCommentSchema,
} from "./schemas";

interface MapLike<K, V> {
  get: (key: K) => V | undefined | null;
}

export interface CustomRequest {
  /** Get user session */
  getSession: () => Awaitable<AuthInfo | null>;

  /** Get user session with role information */
  getSessionWithRole?: (options: {
    page: string;
  }) => Awaitable<AuthInfoWithRole | null>;

  /** Get body (to JSON) */
  body: () => Awaitable<unknown>;

  /** Query parameters */
  queryParams: MapLike<string, string>;

  /** Path parameters */
  params: MapLike<string, string>;
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

export type RouteHandler = (req: CustomRequest) => Promise<CustomResponse>;

export interface CustomCommentRouter {
  "GET /comments/[page]": RouteHandler;
  "GET /comments/[page]/auth": RouteHandler;
  "POST /comments/[page]": RouteHandler;
  "PATCH /comments/[page]/[id]": RouteHandler;
  "DELETE /comments/[page]/[id]": RouteHandler;
  "POST /comments/[page]/[id]/rate": RouteHandler;
  "DELETE /comments/[page]/[id]/rate": RouteHandler;
}

export interface CustomCommentOptions {
  /**
   * Where to fetch role information
   *
   * - `database`: From Storage Adapter
   * - `auth`: From Auth Provider (custom `getSessionWithRole` function)
   * - `none`: Role system disabled (default)
   */
  role?: "database" | "auth" | "none";
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
  role = "none",
}: CustomCommentOptions): CustomCommentRouter {
  async function getSessionWithRole(
    req: CustomRequest,
  ): Promise<AuthInfoWithRole | null> {
    const page = req.params.get("page");
    if (!page) throw new Error("Page parameter required");

    if (role === "auth") {
      if (!req.getSessionWithRole)
        throw new Error(
          "You must implement a `getSessionWithRole` function to use Auth Provider based role system.",
        );

      return req.getSessionWithRole({ page });
    }

    const auth = await req.getSession();
    if (!auth) return null;

    if (role === "none") {
      return {
        ...auth,
        role: null,
      };
    }

    return {
      ...auth,
      role: await adapter.getRole({
        page,
        auth,
      }),
    };
  }

  return {
    "GET /comments/[page]/auth": handleError(async (req) => {
      const auth = await getSessionWithRole(req);

      if (!auth) return NOT_AUTHORIZED;
      return {
        type: "success",
        data: auth,
      };
    }),
    "GET /comments/[page]": handleError(
      async ({ getSession, queryParams, params }) => {
        const auth = (await getSession()) ?? undefined;
        const sort = sortSchema.parse(queryParams.get("sort") ?? undefined);
        const before = queryParams.get("before");
        const after = queryParams.get("after");
        const limit = Number(queryParams.get("limit") ?? 40);
        const thread = queryParams.get("thread") ?? undefined;
        const page = params.get("page");

        if (!page) return INVALID_PARAM;
        if (limit > 50)
          return {
            type: "error",
            status: 400,
            data: {
              message: "The `limit` param cannot exceed 50",
            },
          };

        return {
          type: "success",
          data: await adapter.getComments({
            sort,
            auth,
            thread,
            limit,
            page,
            after: after ? new Date(Number(after)) : undefined,
            before: before ? new Date(Number(before)) : undefined,
          }),
        };
      },
    ),
    "POST /comments/[page]": handleError(
      async ({ body, getSession, params }) => {
        const auth = await getSession();
        const content = postCommentSchema.parse(await body());
        const page = params.get("page");

        if (!auth) return NOT_AUTHORIZED;
        if (!page) return INVALID_PARAM;

        return {
          type: "success",
          data: await adapter.postComment({ auth, body: content, page }),
        };
      },
    ),
    "POST /comments/[page]/[id]/rate": handleError(
      async ({ body, getSession, params }) => {
        const auth = await getSession();
        const id = params.get("id");
        const page = params.get("page");
        if (!id || !page) return INVALID_PARAM;
        if (!auth) return NOT_AUTHORIZED;

        const content = setRateSchema.parse(await body());
        await adapter.setRate({ id, auth, body: content, page });
        return { type: "success", data: { message: "Successful" } };
      },
    ),
    "PATCH /comments/[page]/[id]": handleError(
      async ({ getSession, body, params }) => {
        const auth = await getSession();
        const id = params.get("id");
        const page = params.get("page");
        if (!id || !page) return INVALID_PARAM;
        if (!auth) return NOT_AUTHORIZED;

        const content = updateCommentSchema.parse(await body());
        await adapter.updateComment({ id, auth, body: content, page });
        return { type: "success", data: { message: "Successful" } };
      },
    ),
    "DELETE /comments/[page]/[id]": handleError(async (req) => {
      const auth = await getSessionWithRole(req);
      const id = req.params.get("id");
      const page = req.params.get("page");
      if (!id || !page) return INVALID_PARAM;
      if (!auth) return NOT_AUTHORIZED;

      const author = await adapter.getCommentAuthor({ id });
      if (author !== auth.id && !auth.role?.canDelete) return NOT_AUTHORIZED;

      await adapter.deleteComment({ id, auth, page });
      return { type: "success", data: { message: "Successful" } };
    }),
    "DELETE /comments/[page]/[id]/rate": handleError(
      async ({ getSession, params }) => {
        const auth = await getSession();
        const id = params.get("id");
        const page = params.get("page");
        if (!id || !page) return INVALID_PARAM;
        if (!auth) return NOT_AUTHORIZED;

        await adapter.deleteRate({ id, auth, page });
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
