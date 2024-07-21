import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  type AuthInfo,
  type AuthInfoWithRole,
  type Awaitable,
} from "@fuma-comment/server";
import type {
  CustomCommentOptions,
  CustomRequest,
  CustomResponse,
} from "@fuma-comment/server/custom";
import { CustomComment } from "@fuma-comment/server/custom";

type RouteHandler = (
  req: NextRequest,
  context: {
    params: {
      comment: string[];
    };
  },
) => Promise<NextResponse>;

interface NextCommentRouter {
  GET: RouteHandler;
  POST: RouteHandler;
  PATCH: RouteHandler;
  DELETE: RouteHandler;
}

interface NextCommentOptions extends CustomCommentOptions {
  getSession: (req: NextRequest) => Awaitable<AuthInfo | null>;
  getSessionWithRole?: (
    req: NextRequest,
    options: { page: string },
  ) => Awaitable<AuthInfoWithRole | null>;
}

const NOT_FOUND = NextResponse.json({ message: "Not Found" }, { status: 404 });

function createResponse(result: CustomResponse): NextResponse {
  if (result.type === "success") {
    return NextResponse.json(result.data);
  }

  return NextResponse.json(result.data, { status: result.status });
}

function createRequest(
  req: NextRequest,
  params: Record<string, string>,
  options: NextCommentOptions,
): CustomRequest {
  const { getSessionWithRole, getSession } = options;
  return {
    body() {
      return req.json();
    },
    getSession: () => getSession(req),
    getSessionWithRole: getSessionWithRole
      ? (arg) => getSessionWithRole(req, arg)
      : undefined,
    params: new Map(Object.entries(params)),
    queryParams: req.nextUrl.searchParams,
  };
}

export function NextComment(options: NextCommentOptions): NextCommentRouter {
  const { adapter } = options;
  const internal = CustomComment({ adapter });

  return {
    GET: async (req, context) => {
      const params = context.params.comment;

      // GET /[page]
      if (params.length === 1) {
        const result = await internal["GET /comments/[page]"](
          createRequest(
            req,
            {
              page: params[0],
            },
            options,
          ),
        );

        return createResponse(result);
      }

      return NOT_FOUND;
    },
    POST: async (req, context) => {
      const params = context.params.comment;

      // POST /[page]
      if (params.length === 1) {
        const result = await internal["POST /comments/[page]"](
          createRequest(req, { page: params[0] }, options),
        );

        return createResponse(result);
      }

      // POST /[page]/[id]/rate
      if (params.length === 3 && params[2] === "rate") {
        const result = await internal["POST /comments/[page]/[id]/rate"](
          createRequest(
            req,
            {
              page: params[0],
              id: params[1],
            },
            options,
          ),
        );

        return createResponse(result);
      }

      return NOT_FOUND;
    },
    PATCH: async (req, context) => {
      const params = context.params.comment;

      // PATCH /[page]/[id]
      if (params.length === 2) {
        const result = await internal["PATCH /comments/[page]/[id]"](
          createRequest(
            req,
            {
              page: params[0],
              id: params[1],
            },
            options,
          ),
        );

        return createResponse(result);
      }

      return NOT_FOUND;
    },
    DELETE: async (req, context) => {
      const params = context.params.comment;

      // DELETE /[page]/[id]
      if (params.length === 2) {
        const result = await internal["DELETE /comments/[page]/[id]"](
          createRequest(req, { page: params[0], id: params[1] }, options),
        );

        return createResponse(result);
      }

      // DELETE /[page]/[id]/rate
      if (params.length === 3 && params[2] === "rate") {
        const result = await internal["DELETE /comments/[page]/[id]/rate"](
          createRequest(req, { page: params[0], id: params[1] }, options),
        );

        return createResponse(result);
      }

      return NOT_FOUND;
    },
  };
}
