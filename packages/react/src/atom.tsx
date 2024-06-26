"use client";

import {
  useMemo,
  type ReactNode,
  type HTMLAttributes,
  forwardRef,
} from "react";
import { CommentsProvider as Provider } from "./contexts/comments";
import { useAuthContext } from "./contexts/auth";
import { buttonVariants } from "./components/button";
import { cn } from "./utils/cn";
import { CreateForm } from "./components/comment/create-form";
import { CommentList } from "./components/comment/list";

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
    <div className={cn("flex flex-col gap-2", className)} ref={ref} {...props}>
      <CreateForm />
      {auth.status === "unauthenticated" && <AuthButton />}
    </div>
  );
});

CommentsPost.displayName = "CommentsPost";

export const CommentsList = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      className={cn("flex min-h-[80px] flex-col", className)}
      ref={ref}
      {...props}
    >
      <CommentList />
    </div>
  );
});

CommentsList.displayName = "CommentsList";

function AuthButton(): React.ReactNode {
  const { signIn } = useAuthContext();

  if (typeof signIn === "function")
    return (
      <button className={cn(buttonVariants())} onClick={signIn} type="button">
        Sign In
      </button>
    );

  return signIn;
}
