import type { HTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "./utils/cn";
import * as atom from "./atom";

export interface CommentsProps
  extends Omit<
      HTMLAttributes<HTMLDivElement>,
      keyof atom.CommentsProviderProps | "title"
    >,
    atom.CommentsProviderProps {
  title?: ReactNode;
}

export const Comments = forwardRef<HTMLDivElement, CommentsProps>(
  ({ page, className, title, ...props }, ref) => {
    return (
      <atom.CommentsProvider page={page}>
        <div
          className={cn(
            "rounded-xl border border-fc-border bg-fc-background text-fc-foreground",
            className,
          )}
          ref={ref}
          {...props}
        >
          <div className="border-b border-fc-border p-3">
            {title ? <div className="mb-2">{title}</div> : null}
            <atom.CommentsPost />
          </div>
          <atom.CommentsList />
        </div>
      </atom.CommentsProvider>
    );
  },
);

Comments.displayName = "Comments";
