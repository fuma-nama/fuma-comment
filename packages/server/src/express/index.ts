/* eslint-disable @typescript-eslint/no-misused-promises -- the misuse detection doesn't work properly */
import type { Express, Request, Response } from "express";
import type { AuthInfo, Awaitable, StorageAdapter } from "../types";
import type { CustomRequest, CustomResponse } from "../custom";
import { CustomComment } from "../custom";

interface ExpressOptions {
  app: Express;
  adapter: StorageAdapter;
  getSession: (req: Request) => Awaitable<AuthInfo | null>;
}

export function ExressComment(options: ExpressOptions): void {
  const { adapter, app } = options;
  const custom = CustomComment({ adapter });

  app.get("/api/comments", async (req, res) => {
    const result = await custom["GET /api/comments"](readRequest(req, options));

    sendResponse(res, result);
  });

  app.post("/api/comments", async (req, res) => {
    const result = await custom["POST /api/comments"](
      readRequest(req, options)
    );

    sendResponse(res, result);
  });

  app.patch("/api/comments/:id", async (req, res) => {
    const result = await custom["PATCH /api/comments/[id]"](
      readRequest(req, options)
    );

    sendResponse(res, result);
  });

  app.delete("/api/comments/:id", async (req, res) => {
    const result = await custom["DELETE /api/comments/[id]"](
      readRequest(req, options)
    );

    sendResponse(res, result);
  });

  app.post("/api/comments/:id/rate", async (req, res) => {
    const result = await custom["POST /api/comments/[id]/rate"](
      readRequest(req, options)
    );

    sendResponse(res, result);
  });

  app.delete("/api/comments/:id/rate", async (req, res) => {
    const result = await custom["DELETE /api/comments/[id]/rate"](
      readRequest(req, options)
    );

    sendResponse(res, result);
  });
}

function readRequest(req: Request, options: ExpressOptions): CustomRequest {
  return {
    body: () => req.body as unknown,
    getSession: () => options.getSession(req),
    params: new Map(Object.entries(req.params)),
    queryParams: new Map(Object.entries(req.query) as [string, string][]),
  };
}

function sendResponse(res: Response, result: CustomResponse): void {
  if (result.type === "success") {
    res.status(200).json(result.data);
  } else {
    res.status(result.status).json(result.data);
  }
}
