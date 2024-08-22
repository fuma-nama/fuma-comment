import type { ReactNode } from "react";
import type { Metadata } from "next";
import { DocsLayout } from "fumadocs-ui/layout";
import { pageTree } from "@/app/source";

export const metadata: Metadata = {
  title: {
    template: "Docs | %s",
    default: "Fuma Comment Docs",
  },
  description: "Next.js comments",
};

export default function RootDocsLayout({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return (
    <DocsLayout
      nav={{ title: "Fuma Comment" }}
      githubUrl="https://github.com/fuma-nama/fuma-comment"
      tree={pageTree}
    >
      {children}
    </DocsLayout>
  );
}
