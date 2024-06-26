import { useState, useMemo, useLayoutEffect } from "react";
import type { SerializedComment } from "@fuma-comment/server";
import useSWRMutation from "swr/mutation";
import { cva } from "cva";
import useSWR from "swr";
import { MoreVerticalIcon, ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import { type JSONContent } from "@tiptap/react";
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
import { MenuTrigger, MenuItems, MenuItem, Menu } from "./menu";
import { CommentEdit } from "./comment-edit";
import { buttonVariants } from "./button";
import { Spinner } from "./spinner";
import { CommentReply } from "./comment-reply";
import { ContentRenderer } from "./comment-renderer";

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
      setEdit,
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
          "group relative flex flex-row gap-2 px-3 py-4 text-sm",
          canDisplayComments && "pb-2",
        )}
        data-fc-comment={context.comment.id}
        data-fc-edit={context.isEditing}
        data-fc-reply={context.isReplying}
      >
        {comment.author.image ? (
          <img
            alt="avatar"
            className="size-8 select-none rounded-full bg-fc-muted"
            src={comment.author.image}
          />
        ) : (
          <div className="size-8 rounded-full bg-gradient-to-br from-blue-600 to-red-600" />
        )}
        <div className="w-0 flex-1">
          <div className="mb-2 flex flex-row items-center gap-2">
            <span className="truncate font-semibold">
              {comment.author.name}
            </span>
            <span className="text-xs text-fc-muted-foreground">
              {timestamp}
            </span>
            <CommentMenu />
          </div>
          {edit ? (
            <CommentEdit />
          ) : (
            <>
              <ContentRenderer content={comment.content} />
              {isReply ? <CommentReply /> : <CommentActions />}
            </>
          )}
        </div>
      </div>
      {canDisplayComments ? <CommentReplies /> : null}
    </CommentProvider>
  );
}

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
          },
    );

    onLikeUpdated(comment.id, value);
  };

  const onReply = (): void => {
    setReply(true);
  };

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
        <ThumbsUpIcon aria-label="Like" className="size-4" />
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
        <ThumbsDownIcon aria-label="Dislike" className="size-4" />
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
    },
  );

  const canEdit = session !== null && session.id === comment.author.id;
  const canDelete =
    session !== null &&
    (session.permissions?.delete || session.id === comment.author.id);

  const onCopy = (): void => {
    const text = getTextFromContent(comment.content as JSONContent);

    void navigator.clipboard.writeText(text);
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
        aria-label="Open Menu"
        className={cn(
          buttonVariants({
            size: "icon",
            variant: "ghost",
            className:
              "ml-auto opacity-0 group-hover:opacity-100 data-[state=open]:bg-fc-accent data-[state=open]:opacity-100 disabled:invisible",
          }),
        )}
        disabled={isEditing || isReplying}
      >
        <MoreVerticalIcon className="size-4" />
      </MenuTrigger>
      <MenuItems
        onCloseAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <MenuItem onSelect={onCopy}>Copy</MenuItem>
        {canEdit ? <MenuItem onSelect={onEdit}>Edit</MenuItem> : null}
        {canDelete ? (
          <MenuItem disabled={deleteMutation.isMutating} onSelect={onDelete}>
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
    },
  );

  const onOpen = (): void => {
    setOpen((prev) => !prev);
  };

  return (
    <div className="ml-10">
      <button
        className={cn(buttonVariants({ variant: "ghost", size: "medium" }))}
        onClick={onOpen}
        type="button"
      >
        {open && query.isLoading ? <Spinner className="mr-2" /> : null}
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

function getTextFromContent(content: JSONContent): string {
  if (content.type === "text") return content.text ?? "";
  const child = (content.content?.map((c) => getTextFromContent(c)) ?? [])
    .join("")
    .trimEnd();

  if (content.type === "paragraph") return `${child}\n`;
  return child;
}
