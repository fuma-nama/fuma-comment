import { describe, expect, test } from "vitest";
import type { StorageAdapter } from "../types";
import type { CustomRequest } from ".";
import { CustomComment } from ".";

const mockAdapter: StorageAdapter = {
  deleteComment() {
    // does nothing
  },
  deleteRate() {
    // does nothing
  },
  getComments() {
    return [];
  },
  postComment() {
    // does nothing
  },
  setRate() {
    // does nothing
  },
  updateComment() {
    // does nothing
  },
};

const app = CustomComment({ adapter: mockAdapter });

describe("Custom Comment Routes", () => {
  test.each<{ name: string; req: CustomRequest; success: boolean }>([
    {
      name: "Normal",
      req: {
        getSession() {
          return null;
        },
        body() {
          return null;
        },
        params: new Map(),
        queryParams: new Map(),
      },
      success: true,
    },
    {
      name: "With Auth",
      req: {
        getSession() {
          return { id: "mock_user" };
        },
        body() {
          return null;
        },
        params: new Map(),
        queryParams: new Map(),
      },
      success: true,
    },
    {
      name: "Invalid",
      req: {
        getSession() {
          return null;
        },
        body() {
          return null;
        },
        params: new Map(),
        queryParams: new Map([["sort", "invalid_value"]]),
      },
      success: false,
    },
  ])("GET /api/comments $name", async ({ req, success }) => {
    const result = await app["GET /api/comments"](req);

    expect(result.type).toBe(success ? "success" : "error");
  });

  test.each<{ name: string; req: CustomRequest; success: boolean }>([
    {
      name: "Normal",
      req: {
        body() {
          return { content: "Hello World" };
        },
        getSession() {
          return { id: "mock_user" };
        },
        params: new Map(),
        queryParams: new Map(),
      },
      success: true,
    },
    {
      name: "Invalid",
      req: {
        body() {
          return { content: " " };
        },
        getSession() {
          return { id: "mock_user" };
        },
        params: new Map(),
        queryParams: new Map(),
      },
      success: false,
    },
    {
      name: "Unauthorized",
      req: {
        body() {
          return { content: "Hello World" };
        },
        getSession() {
          return null;
        },
        params: new Map(),
        queryParams: new Map(),
      },
      success: false,
    },
  ])("POST /api/comments $name", async ({ req, success }) => {
    const result = await app["POST /api/comments"](req);

    expect(result.type).toBe(success ? "success" : "error");
  });

  test.each<{ name: string; req: CustomRequest; success: boolean }>([
    {
      name: "Normal",
      req: {
        body() {
          return { content: "Hello World" };
        },
        getSession() {
          return { id: "mock_user" };
        },
        params: new Map([["id", "test"]]),
        queryParams: new Map(),
      },
      success: true,
    },
    {
      name: "Invalid",
      req: {
        body() {
          return { content: " " };
        },
        getSession() {
          return { id: "mock_user" };
        },
        params: new Map([["id", "test"]]),
        queryParams: new Map(),
      },
      success: false,
    },
    {
      name: "Unauthorized",
      req: {
        body() {
          return { content: "Hello World" };
        },
        getSession() {
          return null;
        },
        params: new Map([["id", "test"]]),
        queryParams: new Map(),
      },
      success: false,
    },
  ])("PATCH /api/comments/[id] $name", async ({ req, success }) => {
    const result = await app["PATCH /api/comments/[id]"](req);

    expect(result.type).toBe(success ? "success" : "error");
  });

  test.each<{ name: string; req: CustomRequest; success: boolean }>([
    {
      name: "Normal",
      req: {
        body() {
          return null;
        },
        getSession() {
          return { id: "mock_user" };
        },
        params: new Map([["id", "test"]]),
        queryParams: new Map(),
      },
      success: true,
    },
    {
      name: "Unauthorized",
      req: {
        body() {
          return null;
        },
        getSession() {
          return null;
        },
        params: new Map([["id", "test"]]),
        queryParams: new Map(),
      },
      success: false,
    },
  ])("DELETE /api/comments/[id] $name", async ({ req, success }) => {
    const result = await app["DELETE /api/comments/[id]"](req);

    expect(result.type).toBe(success ? "success" : "error");
  });

  test.each<{ name: string; req: CustomRequest; success: boolean }>([
    {
      name: "Normal",
      req: {
        body() {
          return { like: true };
        },
        getSession() {
          return { id: "mock_user" };
        },
        params: new Map([["id", "test"]]),
        queryParams: new Map(),
      },
      success: true,
    },
    {
      name: "Invalid",
      req: {
        body() {
          return { like: "invalid" };
        },
        getSession() {
          return { id: "mock_user" };
        },
        params: new Map([["id", "test"]]),
        queryParams: new Map(),
      },
      success: false,
    },
    {
      name: "Unauthorized",
      req: {
        body() {
          return null;
        },
        getSession() {
          return null;
        },
        params: new Map([["id", "test"]]),
        queryParams: new Map(),
      },
      success: false,
    },
  ])("POST /api/comments/[id]/rate $name", async ({ req, success }) => {
    const result = await app["POST /api/comments/[id]/rate"](req);

    expect(result.type).toBe(success ? "success" : "error");
  });

  test.each<{ name: string; req: CustomRequest; success: boolean }>([
    {
      name: "Normal",
      req: {
        body() {
          return null;
        },
        getSession() {
          return { id: "mock_user" };
        },
        params: new Map([["id", "test"]]),
        queryParams: new Map(),
      },
      success: true,
    },
    {
      name: "Unauthorized",
      req: {
        body() {
          return null;
        },
        getSession() {
          return null;
        },
        params: new Map([["id", "test"]]),
        queryParams: new Map(),
      },
      success: false,
    },
  ])("DELETE /api/comments/[id]/rate $name", async ({ req, success }) => {
    const result = await app["DELETE /api/comments/[id]/rate"](req);

    expect(result.type).toBe(success ? "success" : "error");
  });
});
