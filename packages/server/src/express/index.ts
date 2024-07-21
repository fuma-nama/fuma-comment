import type { Express, Request, Response } from "express";
import type { AuthInfo, AuthInfoWithRole, Awaitable } from "../types";
import type {
  CustomCommentOptions,
  CustomRequest,
  CustomResponse,
} from "../custom";
import { CustomComment } from "../custom";

interface ExpressOptions extends CustomCommentOptions {
  app: Express;
  /**
   * Base URL of API endpoints
   */
  baseUrl?: string;

  /** Get user session */
  getSession: (req: Request) => Awaitable<AuthInfo | null>;

  /** Get user session with role information */
  getSessionWithRole?: (
    req: Request,
    options: {
      page: string;
    },
  ) => Awaitable<AuthInfoWithRole | null>;
}

/**
 * Create comments API routes
 *
 * Should have `express.json()` body parser enabled
 */
export function ExpressComment(options: ExpressOptions): void {
  const { app } = options;
  const custom = CustomComment(options);

  Object.keys(custom).forEach((key) => {
    const fn = custom[key as keyof typeof custom];
    const [method, path] = key.split(" ");

    const pathWithBase = [
      ...(options.baseUrl ?? "").split("/"),
      ...path.split("/"),
    ]
      .filter((v) => v.length > 0)
      .join("/");

    app[method.toLowerCase() as "get" | "post" | "patch" | "delete"](
      `/${pathWithBase}`,
      (req, res) => {
        void fn(readRequest(req, options))
          .then((result) => {
            sendResponse(res, result);
          })
          .catch((e) => {
            throw e;
          });
      },
    );
  });
}

function readRequest(req: Request, options: ExpressOptions): CustomRequest {
  const getSessionWithRole = options.getSessionWithRole;

  return {
    body: () => req.body as unknown,
    getSession: () => options.getSession(req),
    params: {
      get(key) {
        return req.params[key];
      },
    },
    queryParams: {
      get(key) {
        return req.query[key] as string;
      },
    },
    getSessionWithRole: getSessionWithRole
      ? (v) => getSessionWithRole(req, v)
      : undefined,
  };
}

function sendResponse(res: Response, result: CustomResponse): void {
  if (result.type === "success") {
    res.status(200).json(result.data);
  } else {
    res.status(result.status).json(result.data);
  }
}
