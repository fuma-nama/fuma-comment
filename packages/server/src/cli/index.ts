import { type InferFumaDB } from "fumadb";
import { createCli } from "fumadb/cli";
import { type FumaCommentDB } from "../db";

export function run(db: InferFumaDB<typeof FumaCommentDB>) {
	const { main } = createCli({
		db,
		command: "fuma-comment",
		version: "1.0.0",
	});

	return main();
}
