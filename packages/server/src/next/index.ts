import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import * as comments from "../routes/comments";
import * as rates from "../routes/rates";
import * as comment from "../routes/comment";
import type { StorageAdapter, AuthInfo, Awaitable } from "../types";
import { RouteError } from "../errors";

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

const NOT_AUTHORIZED = NextResponse.json(
  { message: "Not Authorized" },
  { status: 401 }
);

export function NextComment({
  adapter,
  getSession,
}: NextCommentOptions): NextCommentRouter {
  return {
    GET: handleError(async (req, context) => {
      const params = context.params.comment;

      // GET /api/comments
      if (!params) {
        const auth = (await getSession(req)) ?? undefined;
        const sort = comments.sortSchema.parse(
          req.nextUrl.searchParams.get("sort") ?? undefined
        );
        const page = req.nextUrl.searchParams.get("page") ?? undefined;
        const thread = req.nextUrl.searchParams.get("thread") ?? undefined;

        return NextResponse.json(
          await adapter.getComments({ sort, auth, thread, page })
        );
      }

      return NOT_FOUND;
    }),
    POST: handleError(async (req, context) => {
      const params = context.params.comment;

      // POST /api/comments
      if (!params) {
        const auth = (await getSession(req)) ?? undefined;
        const body = comments.postBodySchema.parse(await req.json());
        if (!auth) return NOT_AUTHORIZED;

        await adapter.postComment({ auth, body });
        return NextResponse.json({ message: "Successful" });
      }

      // POST /api/comments/[id]/rate
      if (params.length === 2 && params[1] === "rate") {
        const auth = (await getSession(req)) ?? undefined;
        const body = rates.postBodySchema.parse(await req.json());
        if (!auth) return NOT_AUTHORIZED;

        await adapter.setRate({ id: params[0], auth, body });
        return NextResponse.json({ message: "Successful" });
      }

      return NOT_FOUND;
    }),
    PATCH: handleError(async (req, context) => {
      const params = context.params.comment;

      // PATCH /api/comments/[id]
      if (params?.length === 1) {
        const auth = (await getSession(req)) ?? undefined;
        const body = comment.patchBodySchema.parse(await req.json());
        if (!auth) return NOT_AUTHORIZED;

        await adapter.updateComment({ id: params[0], auth, body });
        return NextResponse.json({ message: "Successful" });
      }

      return NOT_FOUND;
    }),
    DELETE: handleError(async (req, context) => {
      const params = context.params.comment;

      // DELETE /api/comments/[id]
      if (params?.length === 1) {
        const auth = (await getSession(req)) ?? undefined;
        if (!auth) return NOT_AUTHORIZED;

        await adapter.deleteComment({ id: params[0], auth });
        return NextResponse.json({ message: "Successful" });
      }

      // DELETE /api/comments/[id]/rate
      if (params?.length === 2 && params[1] === "rate") {
        const auth = (await getSession(req)) ?? undefined;
        if (!auth) return NOT_AUTHORIZED;

        await adapter.deleteRate({ id: params[0], auth });
        return NextResponse.json({ message: "Successful" });
      }

      return NOT_FOUND;
    }),
  };
}

function handleError(handler: RouteHandler): RouteHandler {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (e) {
      if (e instanceof RouteError) {
        return NextResponse.json(
          { message: e.message },
          { status: e.statusCode }
        );
      }

      if (e instanceof ZodError) {
        const issuesToString = e.issues
          .map(
            (issue) => `${issue.path[issue.path.length - 1]}: ${issue.message}`
          )
          .join("\n");

        return NextResponse.json(
          {
            message: issuesToString,
            info: e,
          },
          { status: 400 }
        );
      }

      throw e;
    }
  };
}
