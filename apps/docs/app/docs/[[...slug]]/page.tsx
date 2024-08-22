import type { Metadata } from "next";
import { DocsPage, DocsBody, DocsTitle } from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import { getPage, getPages } from "@/app/source";

export default function Page({
  params,
}: {
  params: { slug?: string[] };
}): React.ReactElement {
  const page = getPage(params.slug);

  if (!page) {
    notFound();
  }

  const Content = page.data.exports.default;

  return (
    <DocsPage toc={page.data.exports.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsBody>
        <Content />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams(): { slug?: string[] }[] {
  return getPages().map((page) => ({
    slug: page.slugs,
  }));
}

export function generateMetadata({
  params,
}: {
  params: { slug?: string[] };
}): Metadata {
  const page = getPage(params.slug);

  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
