import Elysia, { type ElysiaConfig, status } from "elysia";
import {
  CustomComment,
  type CustomCommentOptions,
  type CustomRequest,
} from "../custom";

export interface CommentPluginOptions<Prefix extends string | undefined>
  extends CustomCommentOptions<CustomRequest> {
  elysia?: ElysiaConfig<Prefix>;
}

export function commentPlugin<Prefix extends string>(
  options: CommentPluginOptions<Prefix>,
) {
  const server = CustomComment(options);

  const app = new Elysia<Prefix>(options.elysia).all(
    "/*",
    async ({ request, body, query, ...ctx }) => {
      const res = await server.handleRequest(
        request.method,
        (ctx.params as Record<string, string>)["*"],
        (params) => {
          const headers = new Map<string, string | readonly string[]>();

          request.headers.forEach((value, key) => {
            headers.set(key, value);
          });

          return {
            method: request.method,
            headers,
            body() {
              return body;
            },
            params,
            queryParams: {
              get(key) {
                return query[key];
              },
            },
          };
        },
      );

      if (!res) return status(404, { message: "Not Found" });
      if (res.type === "success") {
        return res.data;
      }

      return status(res.status, res.data);
    },
  );

  return app;
}
