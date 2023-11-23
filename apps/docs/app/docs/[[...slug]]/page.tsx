import type { Metadata } from "next";
import { MDXContent } from "next-docs-ui/mdx";
import { DocsPage } from "next-docs-ui/page";
import { findNeighbour } from "next-docs-zeta/server";
import { notFound } from "next/navigation";
import { utils, tree, pages } from "@/app/source";

export default function Page({
  params,
}: {
  params: { slug?: string[] };
}): JSX.Element {
  const page = utils.getPage(params.slug);

  if (!page) {
    notFound();
  }

  const neighbour = findNeighbour(tree, utils.getPageUrl(params.slug));
  // eslint-disable-next-line @typescript-eslint/unbound-method -- Component
  const Content = page.data.default;

  return (
    <DocsPage footer={neighbour} toc={page.data.toc}>
      <MDXContent>
        <h1>{page.matter.title}</h1>
        <Content />
      </MDXContent>
    </DocsPage>
  );
}

export function generateStaticParams(): { slug: string[] }[] {
  return pages.map((page) => ({
    slug: page.slugs,
  }));
}

export function generateMetadata({
  params,
}: {
  params: { slug?: string[] };
}): Metadata {
  const page = utils.getPage(params.slug);

  if (!page) notFound();

  return {
    title: page.matter.title,
    description: page.matter.description,
  };
}
