import { ThumbsDown, ThumbsUp } from "lucide-react";
import { cva } from "class-variance-authority";
import { useCallback } from "react";
import { useCommentContext } from "../../contexts/comment";
import { useAuthContext } from "../../contexts/auth";
import { useLatestCallback } from "../../utils/hooks";
import { deleteRate, setRate } from "../../utils/fetcher";
import { onLikeUpdated } from "../../utils/comment-manager";
import { cn } from "../../utils/cn";
import { Dialog, DialogContent, DialogTrigger } from "../dialog";
import { buttonVariants } from "../button";
import { ReplyForm, ReplyHeader } from "./reply-form";

const rateVariants = cva(
  buttonVariants({
    variant: "secondary",
    size: "small",
    className: "gap-1.5",
  }),
  {
    variants: {
      active: {
        true: "bg-fc-accent text-fc-accent-foreground",
        false: "text-fc-muted-foreground",
      },
    },
  },
);

export function Actions({
  canReply = false,
}: {
  canReply?: boolean;
}): React.ReactNode {
  const { comment, isReplying, setReply } = useCommentContext();
  const { session } = useAuthContext();
  const isAuthenticated = session !== null;

  const onRate = useLatestCallback((v: boolean) => {
    // double click
    if (v === comment.liked) {
      void deleteRate({
        id: comment.id,
        page: comment.page,
      });
      onLikeUpdated(comment.id, undefined);
    } else {
      void setRate({
        id: comment.id,
        page: comment.page,
        like: v,
      });
      onLikeUpdated(comment.id, v);
    }
  });

  return (
    <div className="mt-2 flex flex-row gap-1">
      <button
        className={cn(
          rateVariants({
            active: comment.liked === true,
          }),
        )}
        disabled={!isAuthenticated}
        onClick={useCallback(() => {
          onRate(true);
        }, [onRate])}
        type="button"
      >
        <ThumbsUp aria-label="Like" className="size-4" />
        {comment.likes}
      </button>
      <button
        className={cn(
          rateVariants({
            active: comment.liked === false,
          }),
        )}
        disabled={!isAuthenticated}
        onClick={useCallback(() => {
          onRate(false);
        }, [onRate])}
        type="button"
      >
        <ThumbsDown aria-label="Dislike" className="size-4" />
        {comment.dislikes}
      </button>
      {canReply && isAuthenticated ? (
        <Dialog open={isReplying} onOpenChange={setReply}>
          <DialogTrigger className={cn(rateVariants({ active: false }))}>
            Reply
          </DialogTrigger>
          <DialogContent>
            <ReplyHeader />
            <ReplyForm />
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
