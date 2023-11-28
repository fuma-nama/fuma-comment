import Link from "next/link";
import { GithubIcon } from "lucide-react";
import { CommentsWithAuth } from "./page.client";

export default function Page(): JSX.Element {
  return (
    <main className="container flex flex-col py-12">
      <CommentsWithAuth
        title={
          <div className="flex flex-row items-center gap-4">
            <h1 className="font-bold">Fuma Comment</h1>
            <Link className="font-mono text-sm font-bold" href="/docs">
              /docs
            </Link>

            <a
              aria-label="Github"
              className="ml-auto"
              href="https://github.com/fuma-nama/fuma-comment"
              rel="noreferrer noopener"
            >
              <GithubIcon className="h-5 w-5" />
            </a>
          </div>
        }
      />
    </main>
  );
}
