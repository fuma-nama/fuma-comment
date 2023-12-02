import express, { json } from "express";
import { describe, expect, test } from "vitest";
import { createContent, mockAdapter } from "../../test/utils";
import { ExressComment } from ".";

const app = express();
const port = 4000;

app.use(json());

ExressComment({
  app,
  adapter: mockAdapter,
  getSession: () => ({ id: "mock_user" }),
});

app.listen(port);

function doFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(new URL(path, `http://localhost:${port}`), init);
}

describe("Express Server Routes", () => {
  test("GET /api/comments", async () => {
    const result = await doFetch("/api/comments", { method: "GET" });

    expect(result.ok).toBe(true);
    expect(await result.json()).toStrictEqual([]);
  });

  test("GET /api/comments - Invalid", async () => {
    const result = await doFetch("/api/comments?sort=invalid", {
      method: "GET",
    });

    expect(result.ok).toBe(false);
  });

  test("POST /api/comments", async () => {
    const result = await doFetch("/api/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: createContent("Hello World"),
      }),
    });

    expect(result.ok).toBe(true);
  });

  test("POST /api/comments - Invalid", async () => {
    const result = await doFetch("/api/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: createContent(""),
      }),
    });

    expect(result.ok).toBe(false);
  });

  test("PATCH /api/comments/[id]", async () => {
    const result = await doFetch("/api/comments/test", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: createContent("Hello World"),
      }),
    });

    expect(result.ok).toBe(true);
  });

  test("PATCH /api/comments/[id] - Invalid", async () => {
    const result = await doFetch("/api/comments/test", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: createContent(""),
      }),
    });

    expect(result.ok).toBe(false);
  });

  test("DELETE /api/comments/[id]", async () => {
    const result = await doFetch("/api/comments/test", {
      method: "DELETE",
    });

    expect(result.ok).toBe(true);
  });

  test("POST /api/comments/[id]/rate", async () => {
    const result = await doFetch("/api/comments/test/rate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        like: true,
      }),
    });

    expect(result.ok).toBe(true);
  });

  test("POST /api/comments/[id]/rate - Invalid", async () => {
    const result = await doFetch("/api/comments/test/rate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        like: null,
      }),
    });

    expect(result.ok).toBe(false);
  });

  test("DELETE /api/comments/[id]/rate", async () => {
    const result = await doFetch("/api/comments/test/rate", {
      method: "DELETE",
    });

    expect(result.ok).toBe(true);
  });
});
