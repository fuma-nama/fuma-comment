import { DocsLayout } from "fumadocs-ui/layouts/notebook";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { source } from "@/app/source";

export const metadata: Metadata = {
	title: {
		template: "Docs | %s",
		default: "Fuma Comment Docs",
	},
	description: "Next.js comments",
};

export default function RootDocsLayout({ children }: { children: ReactNode }) {
	return (
		<DocsLayout
			nav={{ title: "Fuma Comment" }}
			githubUrl="https://github.com/fuma-nama/fuma-comment"
			tree={source.getPageTree()}
		>
			{children}
		</DocsLayout>
	);
}
