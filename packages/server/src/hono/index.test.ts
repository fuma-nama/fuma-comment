import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { describe, expect, test } from "vitest";
import { createContent, mockAdapter } from "../../test/utils";
import { HonoComment } from ".";

const app = new Hono();
const port = 4001;

HonoComment({
    app,
    storage: mockAdapter,
    auth: {
        getSession: () => ({ id: "mock_user" }),
    },
});

serve({
    fetch: app.fetch,
    port,
});

function doFetch(path: string, init: RequestInit = {}): Promise<Response> {
    return fetch(new URL(path, `http://localhost:${port.toString()}`), init);
}

describe("Hono Server Routes", () => {
    test("Get Comments", async () => {
        const result = await doFetch("/comments/page", { method: "GET" });

        expect(result.ok).toBe(true);
        expect(await result.json()).toStrictEqual([]);
    });

    test("Get Comments - Invalid", async () => {
        const result = await doFetch("/comments/page?sort=invalid", {
            method: "GET",
        });

        expect(result.ok).toBe(false);
    });

    test("Post Comments", async () => {
        const result = await doFetch("/comments/page", {
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

    test("Post Comments - Invalid", async () => {
        const result = await doFetch("/comments/page", {
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

    test("Update Comment", async () => {
        const result = await doFetch("/comments/page/test", {
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

    test("Update Comment - Invalid", async () => {
        const result = await doFetch("/comments/page/test", {
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

    test("Delete Comment", async () => {
        const result = await doFetch("/comments/page/test", {
            method: "DELETE",
        });

        expect(result.ok).toBe(true);
    });

    test("Set Rate", async () => {
        const result = await doFetch("/comments/page/test/rate", {
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

    test("Set Rate - Invalid", async () => {
        const result = await doFetch("/comments/page/test/rate", {
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

    test("Delete Rate", async () => {
        const result = await doFetch("/comments/page/test/rate", {
            method: "DELETE",
        });

        expect(result.ok).toBe(true);
    });
}); 