import "next-docs-ui/style.css";
import { DocsLayout } from "next-docs-ui/layout";
import type { ReactNode } from "react";
import { tree } from "../source";

export default function RootDocsLayout({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return (
    <DocsLayout nav={{ title: "Fuma Comment" }} tree={tree}>
      {children}
    </DocsLayout>
  );
}
