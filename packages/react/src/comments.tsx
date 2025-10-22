import type { ComponentProps, ReactNode } from "react";
import {
  CommentsList,
  CommentsPost,
  CommentsProvider,
  type CommentsProviderProps,
} from "./atom";
import { cn } from "./utils/cn";

type CommentsProps = Omit<
  ComponentProps<"div">,
  keyof CommentsProviderProps | keyof InnerProps
> &
  CommentsProviderProps &
  InnerProps;

interface InnerProps {
  title?: ReactNode;
  editor?: ComponentProps<typeof CommentsPost>;
}

function Comments({
  page,
  className,
  title,
  storage,
  editor,
  mention,
  auth,
  apiUrl,
  ...props
}: ComponentProps<"div"> & CommentsProps): ReactNode {
  return (
    <CommentsProvider
      page={page}
      apiUrl={apiUrl}
      auth={auth}
      storage={storage}
      mention={mention}
    >
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-fc-border bg-fc-background text-fc-foreground",
          className,
        )}
        {...props}
      >
        <div className="relative flex flex-col gap-2">
          {title}
          <CommentsPost {...editor} />
        </div>
        <CommentsList />
      </div>
    </CommentsProvider>
  );
}

export { Comments, type CommentsProps };
