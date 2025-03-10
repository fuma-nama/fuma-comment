import Elysia from "elysia";
import { commentPlugin } from "../src/elysia";
import { mockAdapter } from "./utils";
import { test } from "vitest";
import { node } from "@elysiajs/node";
test("Elysia", async () => {
    const app = new Elysia({ adapter: node(), })
        .use(
            commentPlugin({
                auth: {
                    getSession() {
                        return {
                            id: "test",
                        };
                    },
                },
                storage: mockAdapter,
                elysia: {
                    prefix: "/api/comments"
                }
            }),
        )
        .listen(8080);

    const res = await fetch("http://localhost:8080/api/comments/page");

    console.log(await res.json());
});
