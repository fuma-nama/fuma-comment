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
            "fc-rounded-xl fc-border fc-border-border fc-bg-background fc-text-foreground",
            className
          )}
          ref={ref}
          {...props}
        >
          <div className="fc-border-b fc-border-border fc-p-3">
            {title ? <div className="fc-mb-2">{title}</div> : null}
            <atom.CommentsPost />
          </div>
          <atom.CommentsList />
        </div>
      </atom.CommentsProvider>
    );
  }
);

Comments.displayName = "Comments";
