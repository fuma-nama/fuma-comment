import "next-docs-ui/style.css";
import "../globals.css";
import { DocsLayout } from "next-docs-ui/layout";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { RootProvider } from "next-docs-ui/provider";
import { tree } from "../source";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <RootProvider>
          <DocsLayout
            nav={{ title: <span className="font-bold">Fuma Comment</span> }}
            tree={tree}
          >
            {children}
          </DocsLayout>
        </RootProvider>
      </body>
    </html>
  );
}
