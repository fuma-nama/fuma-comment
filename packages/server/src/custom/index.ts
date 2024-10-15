import { ZodError } from "zod";
import type {
  AuthInfo,
  AuthInfoWithRole,
  Awaitable,
  UserProfile,
} from "../types";
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

export type RouteHandler<R extends CustomRequest> = (
  req: R,
) => Promise<CustomResponse>;

type Keys =
  | "GET /comments/[page]"
  | "GET /comments/[page]/auth"
  | "GET /comments/[page]/users"
  | "POST /comments/[page]"
  | "PATCH /comments/[page]/[id]"
  | "DELETE /comments/[page]/[id]"
  | "POST /comments/[page]/[id]/rate"
  | "DELETE /comments/[page]/[id]/rate";

export type CustomCommentRouter<R extends CustomRequest> = {
  [K in Keys]: RouteHandler<R>;
};

export interface CustomCommentOptions<R extends CustomRequest> {
  /**
   * Where to fetch role information
   *
   * - `database`: From Storage Adapter
   * - `auth`: From Auth Provider (custom `getSessionWithRole` function)
   * - `none`: Role system disabled (default)
   */
  role?: "database" | "auth" | "none";

  /** Get user session */
  getSession: (request: R) => Awaitable<AuthInfo | null>;

  /** Get user session with role information */
  getSessionWithRole?: (
    request: R,
    options: {
      page: string;
    },
  ) => Awaitable<AuthInfoWithRole | null>;

  /**
   * Query users by name
   *
   * For auto-complete feature of mentions
   */
  queryUsers?: (options: {
    name: string;
    page: string;

    /**
     * Max count of results
     */
    limit: number;
  }) => Awaitable<UserProfile[]>;

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

export function CustomComment<R extends CustomRequest>({
  adapter,
  role = "none",
  queryUsers,
  getSession,
  getSessionWithRole,
}: CustomCommentOptions<R>): CustomCommentRouter<R> {
  async function getSessionWithRoleAuto(
    req: R,
  ): Promise<AuthInfoWithRole | null> {
    const page = req.params.get("page");
    if (!page) throw new Error("Page parameter required");

    if (role === "auth") {
      if (!getSessionWithRole)
        throw new Error(
          "You must implement a `getSessionWithRole` function to use Auth Provider based role system.",
        );

      return getSessionWithRole(req, { page });
    }

    const auth = await getSession(req);
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
      const auth = await getSessionWithRoleAuto(req);

      if (!auth) return NOT_AUTHORIZED;
      return {
        type: "success",
        data: auth,
      };
    }),
    "GET /comments/[page]/users": handleError(async (req) => {
      const name = req.queryParams.get("name"),
        page = req.params.get("page");
      if (!name || !page) return INVALID_PARAM;

      if (!queryUsers)
        throw new Error(
          "You must implement the `queryUsers` function to enable mention auto-completion",
        );

      return {
        type: "success",
        data: await queryUsers({ name, page, limit: 10 }),
      };
    }),
    "GET /comments/[page]": handleError(async (req) => {
      const auth = (await getSession(req)) ?? undefined;
      const sort = sortSchema.parse(req.queryParams.get("sort") ?? undefined);
      const before = req.queryParams.get("before");
      const after = req.queryParams.get("after");
      const limit = Number(req.queryParams.get("limit") ?? 40);
      const thread = req.queryParams.get("thread") ?? undefined;
      const page = req.params.get("page");

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
    }),
    "POST /comments/[page]": handleError(async (req) => {
      const auth = await getSession(req);
      const content = postCommentSchema.parse(await req.body());
      const page = req.params.get("page");

      if (!auth) return NOT_AUTHORIZED;
      if (!page) return INVALID_PARAM;

      return {
        type: "success",
        data: await adapter.postComment({ auth, body: content, page }),
      };
    }),
    "POST /comments/[page]/[id]/rate": handleError(async (req) => {
      const id = req.params.get("id");
      const page = req.params.get("page");
      if (!id || !page) return INVALID_PARAM;

      const auth = await getSession(req);
      if (!auth) return NOT_AUTHORIZED;

      const content = setRateSchema.parse(await req.body());
      await adapter.setRate({ id, auth, body: content, page });
      return { type: "success", data: { message: "Successful" } };
    }),
    "PATCH /comments/[page]/[id]": handleError(async (req) => {
      const id = req.params.get("id");
      const page = req.params.get("page");
      if (!id || !page) return INVALID_PARAM;

      const auth = await getSession(req);
      if (!auth) return NOT_AUTHORIZED;

      const content = updateCommentSchema.parse(await req.body());
      await adapter.updateComment({ id, auth, body: content, page });
      return { type: "success", data: { message: "Successful" } };
    }),
    "DELETE /comments/[page]/[id]": handleError(async (req) => {
      const id = req.params.get("id");
      const page = req.params.get("page");
      if (!id || !page) return INVALID_PARAM;

      const auth = await getSessionWithRoleAuto(req);
      if (!auth) return NOT_AUTHORIZED;

      const author = await adapter.getCommentAuthor({ id });
      if (author !== auth.id && !auth.role?.canDelete) return NOT_AUTHORIZED;

      await adapter.deleteComment({ id, auth, page });
      return { type: "success", data: { message: "Successful" } };
    }),
    "DELETE /comments/[page]/[id]/rate": handleError(async (req) => {
      const id = req.params.get("id");
      const page = req.params.get("page");
      if (!id || !page) return INVALID_PARAM;

      const auth = await getSession(req);
      if (!auth) return NOT_AUTHORIZED;

      await adapter.deleteRate({ id, auth, page });
      return { type: "success", data: { message: "Successful" } };
    }),
  };

  function handleError(handler: RouteHandler<R>): RouteHandler<R> {
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
                `${(issue.path.at(-1) ?? "root").toString()}: ${issue.message}`,
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
