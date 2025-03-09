import type { Metadata } from "next";
import {
	DocsPage,
	DocsBody,
	DocsTitle,
	DocsDescription,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { source } from "@/app/source";
import defaultMdxComponents from "fumadocs-ui/mdx";

export default async function Page({
	params,
}: {
	params: Promise<{ slug?: string[] }>;
}) {
	const page = source.getPage((await params).slug);

	if (!page) {
		notFound();
	}

	const Content = page.data.body;

	return (
		<DocsPage toc={page.data.toc} full={page.data.full}>
			<DocsTitle>{page.data.title}</DocsTitle>
			<DocsDescription>{page.data.description}</DocsDescription>
			<DocsBody className="text-fd-muted-foreground">
				<Content
					components={{
						...defaultMdxComponents,
						Tab,
						Tabs,
					}}
				/>
			</DocsBody>
		</DocsPage>
	);
}

export function generateStaticParams(): { slug?: string[] }[] {
	return source.getPages().map((page) => ({
		slug: page.slugs,
	}));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
	const page = source.getPage((await params).slug);

	if (!page) notFound();

	return {
		title: page.data.title,
		description: page.data.description,
	};
}
