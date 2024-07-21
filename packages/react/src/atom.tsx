"use client";

import {
  useMemo,
  type ReactNode,
  type HTMLAttributes,
  forwardRef,
} from "react";
import { CommentsProvider as Provider } from "./contexts/comments";
import {
  AuthProvider,
  type AuthProviderProps,
  useAuthContext,
} from "./contexts/auth";
import { buttonVariants } from "./components/button";
import { cn } from "./utils/cn";
import { CreateForm } from "./components/comment/create-form";
import { CommentList } from "./components/comment/list";

export interface CommentsProviderProps {
  /**
   * Comments will be grouped by `page`
   */
  page: string;

  auth: Omit<AuthProviderProps, "page">;

  children?: ReactNode;
}

export function CommentsProvider({
  page,
  children,
  auth,
}: CommentsProviderProps): React.ReactNode {
  const context = useMemo(
    () => ({
      page,
    }),
    [page],
  );

  return (
    <AuthProvider page={page} {...auth}>
      <Provider value={context}>{children}</Provider>
    </AuthProvider>
  );
}

export const CommentsPost = CreateForm;

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

export function AuthButton(): React.ReactNode {
  const { signIn } = useAuthContext();

  if (typeof signIn === "function")
    return (
      <button className={cn(buttonVariants())} onClick={signIn} type="button">
        Sign In
      </button>
    );

  return signIn;
}
