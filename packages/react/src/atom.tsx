"use client";

import { type ComponentProps, type ReactNode, useMemo } from "react";
import { CreateForm } from "./components/comment/create-form";
import { CommentList } from "./components/comment/list";
import {
  type AuthOptions,
  AuthProvider,
  useAuthContext,
} from "./contexts/auth";
import { CommentsProvider as Provider } from "./contexts/comments";
import { type MentionOptions, MentionProvider } from "./contexts/mention";
import { type StorageContext, StorageProvider } from "./contexts/storage";
import { cn } from "./utils/cn";
import { createFetcher } from "./utils/fetcher";

interface CommentsProviderProps {
  /**
   * The unique identifier for the page where comments are displayed.
   */
  page: string;

  auth: AuthOptions;

  mention?: MentionOptions;

  storage?: StorageContext;

  /**
   * The URL of the API endpoint.
   *
   * @default "/api/comments"
   */
  apiUrl?: string;

  children?: ReactNode;
}

function CommentsProvider({
  page,
  children,
  mention,
  storage,
  auth,
  apiUrl,
}: CommentsProviderProps): ReactNode {
  let child = children;
  const context = useMemo(
    () => ({
      page,
      fetcher: createFetcher(apiUrl),
    }),
    [page, apiUrl],
  );

  if (mention)
    child = <MentionProvider mention={mention}>{child}</MentionProvider>;

  if (storage)
    child = <StorageProvider storage={storage}>{child}</StorageProvider>;

  return (
    <Provider value={context}>
      <AuthProvider page={page} auth={auth}>
        {child}
      </AuthProvider>
    </Provider>
  );
}
const CommentsPost = CreateForm;

function CommentsList({
  className,
  ...props
}: ComponentProps<"div">): ReactNode {
  return (
    <div className={cn("flex flex-col", className)} {...props}>
      <CommentList />
    </div>
  );
}

function AuthButton(props: ComponentProps<"button">): ReactNode {
  const { signIn } = useAuthContext();

  if (typeof signIn === "function")
    return (
      <button {...props} onClick={signIn} type="button">
        {props.children ?? "Sign In"}
      </button>
    );

  return signIn;
}

export { ContentRenderer } from "./components/comment/content-renderer";
export { Comment } from "./components/comment/index";
export {
  CommentsProvider,
  CommentsPost,
  CommentsList,
  AuthButton,
  type CommentsProviderProps,
};
