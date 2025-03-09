import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
export default defineConfig({
	dialect: "postgresql",
	schema: "./lib/schema.ts",
	dbCredentials: {
		url,
	},
});
