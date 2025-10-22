import { column, idColumn, schema, table } from "fumadb/schema";

export const v1 = schema({
	version: "1.0.0",
	tables: {
		comments: table("comments", {
			id: idColumn("id", "varchar(255)").defaultTo$("auto"),
			page: column("page", "varchar(255)"),
			thread: column("thread", "varchar(255)").nullable(),
			author: column("author", "varchar(255)"),
			content: column("content", "json"),
			timestamp: column("timestamp", "timestamp").defaultTo$("now"),
		}),
		rates: table("rates", {
			id: idColumn("id", "varchar(255)").defaultTo$("auto"),

			userId: column("userId", "varchar(255)"),
			commentId: column("commentId", "varchar(255)"),
			like: column("like", "bool"),
		}),
		roles: table("roles", {
			userId: idColumn("userId", "varchar(255)"),
			name: column("name", "varchar(255)"),
			canDelete: column("canDelete", "bool"),
		}),
	},
});
