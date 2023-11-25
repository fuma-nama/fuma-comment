import useSWR from "swr";
import type { HTMLAttributes } from "react";
import { forwardRef, useMemo } from "react";
import { fetchComments, getCommentsKey } from "./utils/fetcher";
import { Spinner } from "./components/spinner";
import { Comment } from "./components/comment";
import { CommentPost } from "./components/comment-post";
import { buttonVariants } from "./components/button";
import { useAuthContext } from "./contexts/auth";
import { cn } from "./utils/cn";
import { syncComments } from "./utils/comment-manager";
import { CommentsProvider, useCommentsContext } from "./contexts/comments";

interface CommentsProps extends HTMLAttributes<HTMLDivElement> {
  page?: string;
}

export const Comments = forwardRef<HTMLDivElement, CommentsProps>(
  ({ page, className, ...props }, ref) => {
    const auth = useAuthContext();
    const context = useMemo(
      () => ({
        page,
      }),
      [page]
    );

    return (
      <CommentsProvider value={context}>
        <div
          className={cn(
            "fc-bg-background fc-text-foreground fc-p-4 fc-rounded-xl fc-border fc-border-border",
            className
          )}
          ref={ref}
          {...props}
        >
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
);

Comments.displayName = "Comments";

function List(): JSX.Element {
  const { page } = useCommentsContext();
  const query = useSWR(
    getCommentsKey(undefined, page),
    ([_, thread, p]) => fetchComments({ page: p, thread }),
    {
      onSuccess(data) {
        syncComments(data);
      },
    }
  );

  return (
    <div className="fc-flex fc-flex-col fc-mt-4 fc-border-t fc-border-border fc-pt-4 -fc-mx-3">
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
