import { createSearchAPI } from "next-docs-zeta/search/server";
import { pages, utils } from "@/app/source";

export const { GET } = createSearchAPI("advanced", {
  indexes: pages.map((page) => ({
    id: page.file.id,
    title: page.matter.title,
    structuredData: page.data.structuredData,
    url: utils.getPageUrl(page.slugs),
  })),
});
