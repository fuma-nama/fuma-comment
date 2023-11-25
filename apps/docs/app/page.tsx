import "@fuma-comment/react/dist/style.css";
import Link from "next/link";
import { CommentsWithAuth } from "./page.client";

export default function Page(): JSX.Element {
  return (
    <main className="flex flex-col py-12 container">
      <CommentsWithAuth
        title={
          <div className="flex flex-row gap-4 items-center">
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
              <svg
                className="w-6 h-6"
                fill="none"
                height="24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="24"
              >
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
            </a>
          </div>
        }
      />
    </main>
  );
}
