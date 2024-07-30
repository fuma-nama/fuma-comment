import type { HTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "./utils/cn";
import {
  CommentsProvider,
  CommentsPost,
  AuthButton,
  CommentsList,
  type CommentsProviderProps,
} from "./atom";
import { useAuthContext } from "./contexts/auth";

export type CommentsProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  keyof CommentsProviderProps | keyof InnerProps
> &
  CommentsProviderProps &
  InnerProps;

interface InnerProps {
  title?: ReactNode;

  /**
   * title to show when the user has not logged in.
   *
   * Fallbacks to default `title` when not specified.
   */
  titleUnauthorized?: ReactNode;
}

export const Comments = forwardRef<HTMLDivElement, CommentsProps>(
  ({ page, className, title, storage, mention, auth, ...props }, ref) => {
    return (
      <CommentsProvider
        page={page}
        auth={auth}
        storage={storage}
        mention={mention}
      >
        <div
          className={cn(
            "rounded-xl border border-fc-border bg-fc-background text-fc-foreground",
            className,
          )}
          ref={ref}
          {...props}
        >
          <Inner title={title} />
          <CommentsList />
        </div>
      </CommentsProvider>
    );
  },
);

function Inner(props: InnerProps): ReactNode {
  const { session, isLoading } = useAuthContext();

  return (
    <div className="relative flex flex-col gap-2 border-b border-fc-border p-3">
      {props.title}
      <CommentsPost />
      {!isLoading && !session ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-fc-background/50 p-3 text-center backdrop-blur-lg">
          {props.titleUnauthorized ?? props.title}
          <AuthButton />
        </div>
      ) : null}
    </div>
  );
}

Comments.displayName = "Comments";
