import { ThumbsDown, ThumbsUp } from "lucide-react";
import { cva } from "cva";
import { useCommentContext } from "../../contexts/comment";
import { useAuthContext } from "../../contexts/auth";
import { useLatestCallback } from "../../utils/hooks";
import { fetcher } from "../../utils/fetcher";
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
  const { status } = useAuthContext();
  const isAuthenticated = status === "authenticated";

  const onRate = useLatestCallback((v: boolean) => {
    void fetcher(
      `/api/comments/${comment.id}/rate`,
      v === comment.liked
        ? {
            method: "DELETE",
          }
        : {
            method: "POST",
            body: JSON.stringify({ like: v }),
          },
    );

    onLikeUpdated(comment.id, v === comment.liked ? undefined : v);
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
        onClick={() => {
          onRate(true);
        }}
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
        onClick={() => {
          onRate(false);
        }}
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
