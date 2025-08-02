import { fumadb } from "fumadb";
import { v1 } from "./schemas/v1";

export const FumaCommentDB = fumadb({
	namespace: "fuma-comment",
	schemas: [v1],
});
