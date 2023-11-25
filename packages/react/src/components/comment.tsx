import { Menu } from "@headlessui/react";
import { useState, useMemo, useLayoutEffect } from "react";
import type { SerializedComment } from "@fuma-comment/server";
import useSWRMutation from "swr/mutation";
import { cva } from "cva";
import useSWR from "swr";
import { cn } from "../utils/cn";
import { toLocalString } from "../utils/date";
import { fetchComments, fetcher, getCommentsKey } from "../utils/fetcher";
import {
  type CommentContext,
  useCommentContext,
  CommentProvider,
} from "../contexts/comment";
import { useAuthContext } from "../contexts/auth";
import {
  onCommentDeleted,
  onLikeUpdated,
  syncComments,
  updateComment,
  useCommentManager,
} from "../utils/comment-manager";
import { MenuTrigger, MenuItems, MenuItem } from "./menu";
import { CommentEdit } from "./comment-edit";
import { buttonVariants } from "./button";
import { Spinner } from "./spinner";
import { CommentReply } from "./comment-reply";

export function Comment({
  comment: cached,
}: {
  comment: SerializedComment;
}): JSX.Element {
  const [timestamp, setTimestamp] = useState("");
  const [edit, setEdit] = useState(false);
  const [isReply, setIsReply] = useState(false);
  const comment = useCommentManager(cached);

  const context = useMemo<CommentContext>(() => {
    return {
      isEditing: edit,
      isReplying: isReply,
      setEdit: (v) => {
        setEdit(v);
      },
      setReply: setIsReply,
      comment,
    };
  }, [comment, edit, isReply]);

  const canDisplayComments = !comment.threadId && comment.replies > 0;

  useLayoutEffect(() => {
    const parsed = new Date(comment.timestamp);
    setTimestamp(toLocalString(parsed));
  }, [comment.timestamp]);

  return (
    <CommentProvider value={context}>
      <div
        className={cn(
          "fc-group fc-relative fc-flex fc-flex-row fc-text-sm fc-px-3 fc-py-4",
          canDisplayComments && "fc-pb-2"
        )}
        data-fc-comment={context.comment.id}
        data-fc-edit={context.isEditing}
        data-fc-reply={context.isReplying}
      >
        {comment.author.image ? (
          <img
            alt="avatar"
            className="fc-w-8 fc-h-8 fc-rounded-full fc-bg-card fc-select-none"
            height={32}
            src={comment.author.image}
            width={32}
          />
        ) : (
          <div className="fc-w-8 fc-h-8 fc-rounded-full fc-bg-gradient-to-br fc-from-blue-600 fc-to-red-600" />
        )}
        <div className="fc-flex-1 fc-w-0 fc-ml-2">
          <p className="fc-inline-flex fc-gap-2 fc-items-center fc-mb-2">
            <span className="fc-font-semibold">{comment.author.name}</span>
            <span className="fc-text-muted-foreground fc-text-xs">
              {timestamp}
            </span>
          </p>
          {edit ? (
            <CommentEdit />
          ) : (
            <>
              <p className="fc-whitespace-pre-wrap fc-break-words">
                {comment.content}
              </p>
              {isReply ? <CommentReply /> : <CommentActions />}
            </>
          )}
        </div>
        <CommentMenu />
      </div>
      {canDisplayComments ? <CommentReplies /> : null}
    </CommentProvider>
  );
}

const rateVariants = cva(
  buttonVariants({
    variant: "secondary",
    size: "small",
    className: "fc-gap-1.5",
  }),
  {
    variants: {
      active: {
        true: "fc-bg-accent fc-text-accent-foreground",
        false: "fc-text-muted-foreground",
      },
    },
  }
);

function CommentActions(): JSX.Element {
  const { comment, setReply } = useCommentContext();
  const { status } = useAuthContext();

  const isAuthenticated = status === "authenticated";

  const onRate = (v: boolean): void => {
    const value = v === comment.liked ? undefined : v;
    void fetcher(
      `/api/comments/${comment.id}/rate`,
      value === undefined
        ? {
            method: "DELETE",
          }
        : {
            method: "POST",
            body: JSON.stringify({ like: value }),
          }
    );

    onLikeUpdated(comment.id, value);
  };

  const onReply = (): void => {
    setReply(true);
  };

  return (
    <div className="fc-flex fc-flex-row fc-gap-1 fc-mt-2">
      <button
        className={cn(
          rateVariants({
            active: comment.liked === true,
          })
        )}
        disabled={!isAuthenticated}
        onClick={() => {
          onRate(true);
        }}
        type="button"
      >
        <svg
          aria-label="Like"
          className="fc-w-4 fc-h-4"
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
        >
          <path d="M7 10v12" />
          <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
        </svg>
        {comment.likes}
      </button>
      <button
        className={cn(
          rateVariants({
            active: comment.liked === false,
          })
        )}
        disabled={!isAuthenticated}
        onClick={() => {
          onRate(false);
        }}
        type="button"
      >
        <svg
          aria-label="Dislike"
          className="fc-w-4 fc-h-4"
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
        >
          <path d="M17 14V2" />
          <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
        </svg>
        {comment.dislikes}
      </button>
      {!comment.threadId && isAuthenticated ? (
        <button
          className={cn(rateVariants({ active: false }))}
          onClick={onReply}
          type="button"
        >
          Reply
        </button>
      ) : null}
    </div>
  );
}

function CommentMenu(): JSX.Element {
  const { session } = useAuthContext();
  const { comment, isEditing, isReplying, setEdit } = useCommentContext();

  const deleteMutation = useSWRMutation(
    getCommentsKey(comment.threadId),
    ([key]) => fetcher(`${key}/${comment.id}`, { method: "DELETE" }),
    {
      onSuccess() {
        onCommentDeleted(comment);
      },
    }
  );

  const canEdit = session !== null && session.id === comment.author.id;
  const canDelete =
    session !== null &&
    (session.permissions?.delete || session.id === comment.author.id);

  const onCopy = (): void => {
    void navigator.clipboard.writeText(comment.content);
  };

  const onEdit = (): void => {
    setEdit(true);
  };

  const onDelete = (): void => {
    void deleteMutation.trigger();
  };

  return (
    <Menu>
      <MenuTrigger
        className={cn(
          buttonVariants({
            size: "icon",
            variant: "ghost",
          }),
          isEditing || isReplying
            ? "fc-hidden"
            : "fc-opacity-0 group-hover:fc-opacity-100 data-[headlessui-state=open]:fc-bg-accent data-[headlessui-state=open]:fc-opacity-100"
        )}
      >
        <svg
          className="fc-w-4 fc-h-4"
          fill="none"
          height="24"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
        >
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      </MenuTrigger>
      <MenuItems>
        <MenuItem onClick={onCopy}>Copy</MenuItem>
        {canEdit ? <MenuItem onClick={onEdit}>Edit</MenuItem> : null}
        {canDelete ? (
          <MenuItem disabled={deleteMutation.isMutating} onClick={onDelete}>
            Delete
          </MenuItem>
        ) : null}
      </MenuItems>
    </Menu>
  );
}

function CommentReplies(): JSX.Element {
  const { comment } = useCommentContext();
  const [open, setOpen] = useState(false);
  const query = useSWR(
    open ? getCommentsKey(comment.id) : null,
    ([_, thread, page]) => fetchComments({ thread, page, sort: "oldest" }),
    {
      onSuccess(data) {
        updateComment(comment.id, (c) => ({ ...c, replies: data.length }));
        syncComments(data);
      },
    }
  );

  const onOpen = (): void => {
    setOpen((prev) => !prev);
  };

  return (
    <div className="fc-ml-10">
      <button
        className={cn(buttonVariants({ variant: "ghost", size: "medium" }))}
        onClick={onOpen}
        type="button"
      >
        {open && query.isLoading ? <Spinner className="fc-mr-2" /> : null}
        {comment.replies} Replies
      </button>
      {open ? (
        <div>
          {query.data?.map((reply) => (
            <Comment comment={reply} key={reply.id} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
