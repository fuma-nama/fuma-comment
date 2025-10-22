import Link from "next/link";
import type { ReactNode } from "react";

export default function Layout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return (
    <div className="px-2">
      <div
        className="fixed inset-x-0 top-0 z-40 h-16 backdrop-blur-lg"
        style={{
          maskImage: "linear-gradient(to bottom,white 50%,transparent)",
        }}
      />
      <nav className="sticky top-4 z-40 mx-auto w-full max-w-[1200px] rounded-lg border border-fc-foreground/10 bg-fc-popover px-4 py-2.5 shadow-lg">
        <Link
          href="/"
          prefetch={false}
          className="inline-flex items-center gap-2 text-sm font-medium"
        >
          Fuma Comment
          <span className="rounded-md bg-fc-primary px-1 py-0.5 text-xs text-fc-primary-foreground">
            Dashboard
          </span>
        </Link>
      </nav>
      <main className="mx-auto mt-8 w-full max-w-[1200px]">{children}</main>
    </div>
  );
}
