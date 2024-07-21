import { describe, expect, test } from "vitest";
import type { StorageAdapter } from "../adapter";
import { createContent } from "../../test/utils";
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
    return {
      id: "xx",
      timestamp: new Date(Date.now()),
      author: {
        id: "xxx",
        name: "hello",
      },
      likes: 0,
      dislikes: 0,
      page: "default",
      content: {},
      replies: 0,
    };
  },
  setRate() {
    // does nothing
  },
  updateComment() {
    // does nothing
  },
  getRole() {
    return null;
  },
  getCommentAuthor() {
    return "mock_user";
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
        params: new Map([["page", "default"]]),
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
        params: new Map([["page", "default"]]),
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
  ])("Get Comments $name", async ({ req, success }) => {
    const result = await app["GET /comments/[page]"](req);

    expect(result.type).toBe(success ? "success" : "error");
  });

  test.each<{ name: string; req: CustomRequest; success: boolean }>([
    {
      name: "Normal",
      req: {
        body() {
          return { content: createContent("Hello World") };
        },
        getSession() {
          return { id: "mock_user" };
        },
        params: new Map([["page", "default"]]),
        queryParams: new Map(),
      },
      success: true,
    },
    {
      name: "Invalid",
      req: {
        body() {
          return { content: createContent(" ") };
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
          return { content: createContent("Hello World") };
        },
        getSession() {
          return null;
        },
        params: new Map([["page", "default"]]),
        queryParams: new Map(),
      },
      success: false,
    },
  ])("Post Comments $name", async ({ req, success }) => {
    const result = await app["POST /comments/[page]"](req);

    expect(result.type).toBe(success ? "success" : "error");
  });

  test.each<{ name: string; req: CustomRequest; success: boolean }>([
    {
      name: "Normal",
      req: {
        body() {
          return { content: createContent("Hello World") };
        },
        getSession() {
          return { id: "mock_user" };
        },
        params: new Map([
          ["id", "test"],
          ["page", "default"],
        ]),
        queryParams: new Map(),
      },
      success: true,
    },
    {
      name: "Invalid",
      req: {
        body() {
          return { content: createContent(" ") };
        },
        getSession() {
          return { id: "mock_user" };
        },
        params: new Map([
          ["id", "test"],
          ["page", "default"],
        ]),
        queryParams: new Map(),
      },
      success: false,
    },
    {
      name: "Unauthorized",
      req: {
        body() {
          return { content: createContent("Hello World") };
        },
        getSession() {
          return null;
        },
        params: new Map([
          ["id", "test"],
          ["page", "default"],
        ]),
        queryParams: new Map(),
      },
      success: false,
    },
  ])("Update Comments $name", async ({ req, success }) => {
    const result = await app["PATCH /comments/[page]/[id]"](req);

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
        params: new Map([
          ["id", "test"],
          ["page", "default"],
        ]),
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
        params: new Map([
          ["id", "test"],
          ["page", "default"],
        ]),
        queryParams: new Map(),
      },
      success: false,
    },
  ])("Delete Comments $name", async ({ req, success }) => {
    const result = await app["DELETE /comments/[page]/[id]"](req);

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
        params: new Map([
          ["id", "test"],
          ["page", "default"],
        ]),
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
        params: new Map([
          ["id", "test"],
          ["page", "default"],
        ]),
        queryParams: new Map(),
      },
      success: false,
    },
  ])("POST /api/comments/[id]/rate $name", async ({ req, success }) => {
    const result = await app["POST /comments/[page]/[id]/rate"](req);

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
        params: new Map([
          ["id", "test"],
          ["page", "default"],
        ]),
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
        params: new Map([
          ["id", "test"],
          ["page", "default"],
        ]),
        queryParams: new Map(),
      },
      success: false,
    },
  ])("DELETE /api/comments/[id]/rate $name", async ({ req, success }) => {
    const result = await app["DELETE /comments/[page]/[id]/rate"](req);

    expect(result.type).toBe(success ? "success" : "error");
  });
});
