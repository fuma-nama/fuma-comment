import { fromMap } from "next-docs-mdx/map";
import { map } from "@/_map";

export const { pages, tree, ...utils } = fromMap(map);
