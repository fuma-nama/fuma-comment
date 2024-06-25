import {
  useMemo,
  type ReactNode,
  type HTMLAttributes,
  forwardRef,
} from "react";
import useSWR from "swr";
import {
  CommentsProvider as Provider,
  useCommentsContext,
} from "./contexts/comments";
import { fetchComments, getCommentsKey } from "./utils/fetcher";
import { syncComments } from "./utils/comment-manager";
import { useAuthContext } from "./contexts/auth";
import { Spinner } from "./components/spinner";
import { Comment } from "./components/comment";
import { buttonVariants } from "./components/button";
import { cn } from "./utils/cn";
import { CommentPost } from "./components/comment-post";

export interface CommentsProviderProps {
  /**
   * Comments will be grouped by `page`
   */
  page?: string;

  children?: ReactNode;
}

export function CommentsProvider({
  page,
  children,
}: CommentsProviderProps): JSX.Element {
  const context = useMemo(
    () => ({
      page,
    }),
    [page],
  );

  return <Provider value={context}>{children}</Provider>;
}

export const CommentsPost = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const auth = useAuthContext();

  return (
    <div
      className={cn("fc-flex fc-flex-col fc-gap-2", className)}
      ref={ref}
      {...props}
    >
      <CommentPost />
      {auth.status === "unauthenticated" && <AuthButton />}
    </div>
  );
});

CommentsPost.displayName = "CommentsPost";

export const CommentsList = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { page } = useCommentsContext();
  const query = useSWR(
    getCommentsKey(undefined, page),
    ([_, thread, p]) => fetchComments({ page: p, thread }),
    {
      onSuccess(data) {
        syncComments(data);
      },
    },
  );

  return (
    <div
      className={cn("fc-flex fc-min-h-[80px] fc-flex-col", className)}
      ref={ref}
      {...props}
    >
      {query.isLoading ? <Spinner className="fc-m-auto fc-h-8 fc-w-8" /> : null}
      {query.data?.length === 0 && (
        <p className="fc-m-auto fc-text-center fc-text-sm fc-text-muted-foreground">
          No comments
        </p>
      )}
      {query.data?.map((comment) => (
        <Comment comment={comment} key={comment.id} />
      ))}
    </div>
  );
});

CommentsList.displayName = "CommentsList";

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
