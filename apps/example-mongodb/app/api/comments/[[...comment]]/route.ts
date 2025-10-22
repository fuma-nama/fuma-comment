import { createBetterAuthAdapter } from "@fuma-comment/server/adapters/better-auth";
import { createMongoDBAdapter } from "@fuma-comment/server/adapters/mongo-db";
import { NextComment } from "@fuma-comment/server/next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/database";

export const { GET, DELETE, PATCH, POST } = NextComment({
  mention: { enabled: true },
  auth: createBetterAuthAdapter(auth),
  storage: createMongoDBAdapter({
    db,
    auth: "better-auth",
  }),
});
