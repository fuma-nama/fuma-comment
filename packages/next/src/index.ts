import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthInfo, Awaitable, StorageAdapter } from "@fuma-comment/server";
import type { CustomResponse } from "@fuma-comment/server/custom";
import { CustomComment } from "@fuma-comment/server/custom";

type RouteHandler = (
  req: NextRequest,
  context: {
    params: {
      comment?: string[];
    };
  }
) => Promise<NextResponse>;

interface NextCommentRouter {
  GET: RouteHandler;
  POST: RouteHandler;
  PATCH: RouteHandler;
  DELETE: RouteHandler;
}

interface NextCommentOptions {
  adapter: StorageAdapter;
  getSession: (req: NextRequest) => Awaitable<AuthInfo | null>;
}

const NOT_FOUND = NextResponse.json({ message: "Not Found" }, { status: 404 });

function createResponse(result: CustomResponse): NextResponse {
  if (result.type === "success") {
    return NextResponse.json(result.data);
  }

  return NextResponse.json(result.data, { status: result.status });
}

export function NextComment({
  adapter,
  getSession,
}: NextCommentOptions): NextCommentRouter {
  const internal = CustomComment({ adapter });

  return {
    GET: async (req, context) => {
      const params = context.params.comment;

      // GET /api/comments
      if (!params) {
        const auth = await getSession(req);
        const result = await internal["GET /api/comments"]({
          body() {
            return req.json();
          },
          getSession() {
            return auth;
          },
          params: new Map(),
          queryParams: new Map(req.nextUrl.searchParams),
        });

        return createResponse(result);
      }

      return NOT_FOUND;
    },
    POST: async (req, context) => {
      const params = context.params.comment;

      // POST /api/comments
      if (!params) {
        const auth = await getSession(req);
        const result = await internal["POST /api/comments"]({
          body() {
            return req.json();
          },
          getSession() {
            return auth;
          },
          params: new Map(),
          queryParams: new Map(req.nextUrl.searchParams),
        });

        return createResponse(result);
      }

      // POST /api/comments/[id]/rate
      if (params.length === 2 && params[1] === "rate") {
        const auth = await getSession(req);
        const result = await internal["POST /api/comments/[id]/rate"]({
          body() {
            return req.json();
          },
          getSession() {
            return auth;
          },
          params: new Map([["id", params[0]]]),
          queryParams: new Map(req.nextUrl.searchParams),
        });

        return createResponse(result);
      }

      return NOT_FOUND;
    },
    PATCH: async (req, context) => {
      const params = context.params.comment;

      // PATCH /api/comments/[id]
      if (params?.length === 1) {
        const auth = await getSession(req);
        const result = await internal["PATCH /api/comments/[id]"]({
          body() {
            return req.json();
          },
          getSession() {
            return auth;
          },
          params: new Map([["id", params[0]]]),
          queryParams: new Map(req.nextUrl.searchParams),
        });

        return createResponse(result);
      }

      return NOT_FOUND;
    },
    DELETE: async (req, context) => {
      const params = context.params.comment;

      // DELETE /api/comments/[id]
      if (params?.length === 1) {
        const auth = await getSession(req);
        const result = await internal["DELETE /api/comments/[id]"]({
          body() {
            return req.json();
          },
          getSession() {
            return auth;
          },
          params: new Map([["id", params[0]]]),
          queryParams: new Map(req.nextUrl.searchParams),
        });

        return createResponse(result);
      }

      // DELETE /api/comments/[id]/rate
      if (params?.length === 2 && params[1] === "rate") {
        const auth = await getSession(req);
        const result = await internal["DELETE /api/comments/[id]/rate"]({
          body() {
            return req.json();
          },
          getSession() {
            return auth;
          },
          params: new Map([["id", params[0]]]),
          queryParams: new Map(req.nextUrl.searchParams),
        });

        return createResponse(result);
      }

      return NOT_FOUND;
    },
  };
}
