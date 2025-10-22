import type { Context, Hono, HonoRequest } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type {
  CustomCommentOptions,
  CustomRequest,
  CustomResponse,
} from "../custom";
import { CustomComment } from "../custom";

type RequestType = CustomRequest & {
  req: HonoRequest;
};

interface HonoOptions extends CustomCommentOptions<RequestType> {
  app: Hono;
  /**
   * Base URL of API endpoints
   */
  baseUrl?: string;
}

type HonoContext = Context;

/**
 * Create comments API routes for Hono
 */
export function HonoComment(options: HonoOptions): void {
  const { app } = options;
  const methods = CustomComment<RequestType>(options).methods;

  for (const key of Object.keys(methods)) {
    const fn = methods[key as keyof typeof methods];
    const [method, path] = key.split(" ");

    const pathWithBase = [
      ...(options.baseUrl ?? "").split("/"),
      ...path.split("/"),
    ]
      .filter((v) => v.length > 0)
      .map((v) =>
        v.startsWith("[") && v.endsWith("]") ? `:${v.slice(1, -1)}` : v,
      )
      .join("/");

    app[method.toLowerCase() as "get" | "post" | "patch" | "delete"](
      `/${pathWithBase}`,
      async (c: HonoContext) => {
        const result = await fn(readRequest(c));
        return sendResponse(c, result);
      },
    );
  }
}

function readRequest(c: HonoContext): RequestType {
  const headers = c.req.header();
  return {
    method: c.req.method,
    req: c.req,
    body: () => c.req.json(),
    headers: new Map(Object.entries(headers)),
    params: {
      get(key) {
        return c.req.param(key);
      },
    },
    queryParams: {
      get(key) {
        return c.req.query(key);
      },
    },
  };
}

function sendResponse(c: HonoContext, result: CustomResponse): Response {
  if (result.type === "success") {
    return c.json(result.data, 200);
  }

  return c.json(result.data, result.status as ContentfulStatusCode);
}
