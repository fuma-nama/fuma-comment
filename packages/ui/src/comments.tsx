import useSWR from "swr";
import type { SerializedComment } from "server";
import { useMemo } from "react";
import { fetcher, getCommentsKey } from "./utils/fetcher";
import { Spinner } from "./components/spinner";
import { Comment } from "./components/comment";
import { CommentPost } from "./components/comment-post";
import { buttonVariants } from "./components/button";
import { useAuthContext } from "./contexts/auth";
import { cn } from "./utils/cn";
import { syncComments } from "./utils/comment-manager";
import { CommentsProvider, useCommentsContext } from "./contexts/comments";

interface CommentsProps {
  page?: string;
}

export function Comments({ page }: CommentsProps): JSX.Element {
  const auth = useAuthContext();
  const context = useMemo(
    () => ({
      page,
    }),
    [page]
  );

  return (
    <CommentsProvider value={context}>
      <div className="fc-bg-background fc-text-foreground fc-p-4 fc-rounded-xl fc-border fc-border-border">
        <p className="fc-font-bold fc-mb-4">Comments</p>
        <CommentPost />
        {auth.status === "unauthenticated" && (
          <div className="fc-mt-2">
            <AuthButton />
          </div>
        )}
        <List />
      </div>
    </CommentsProvider>
  );
}

function List(): JSX.Element {
  const { page } = useCommentsContext();
  const query = useSWR(
    getCommentsKey(undefined, page),
    ([key, _, p]) => {
      const params = new URLSearchParams();

      if (p) params.append("page", p);
      return fetcher<SerializedComment[]>(`${key}?${params.toString()}`);
    },
    {
      onSuccess(data) {
        syncComments(data);
      },
    }
  );

  return (
    <div className="fc-flex fc-flex-col fc-mt-4 fc-border-t fc-border-border fc-pt-4">
      {query.isLoading ? (
        <Spinner className="fc-w-8 fc-h-8 fc-mx-auto" />
      ) : (
        query.data?.map((comment) => (
          <Comment comment={comment} key={comment.id} />
        ))
      )}
    </div>
  );
}

function AuthButton(): JSX.Element {
  const { signIn } = useAuthContext();

  if (typeof signIn === "function")
    return (
      <button className={cn(buttonVariants())} onClick={signIn} type="button">
        Sign In
      </button>
    );

  return <>{signIn}</>;
}
