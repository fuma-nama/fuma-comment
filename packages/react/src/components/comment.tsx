import { useState, useMemo, useLayoutEffect, useRef } from "react";
import type { SerializedComment } from "@fuma-comment/server";
import useSWRMutation from "swr/mutation";
import { cva } from "cva";
import useSWR from "swr";
import { MoreVerticalIcon, ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import { type Editor, type JSONContent } from "@tiptap/react";
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
  const editorRef = useRef<Editor | null>(null);

  const context = useMemo<CommentContext>(() => {
    return {
      isEditing: edit,
      isReplying: isReply,
      setEdit: (v) => {
        setEdit(v);
      },
      setReply: setIsReply,
      comment,
      editorRef,
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
          "fc-group fc-relative fc-flex fc-flex-row fc-px-3 fc-py-4 fc-text-sm",
          canDisplayComments && "fc-pb-2"
        )}
        data-fc-comment={context.comment.id}
        data-fc-edit={context.isEditing}
        data-fc-reply={context.isReplying}
      >
        {comment.author.image ? (
          <img
            alt="avatar"
            className="fc-h-8 fc-w-8 fc-select-none fc-rounded-full fc-bg-card"
            height={32}
            src={comment.author.image}
            width={32}
          />
        ) : (
          <div className="fc-h-8 fc-w-8 fc-rounded-full fc-bg-gradient-to-br fc-from-blue-600 fc-to-red-600" />
        )}
        <div className="fc-ml-2 fc-w-0 fc-flex-1">
          <div className="fc-mb-2 fc-flex fc-flex-row fc-items-center fc-gap-2">
            <span className="fc-overflow-hidden fc-overflow-ellipsis fc-whitespace-nowrap fc-font-semibold">
              {comment.author.name}
            </span>
            <span className="fc-text-xs fc-text-muted-foreground">
              {timestamp}
            </span>
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
    <div className="fc-mt-2 fc-flex fc-flex-row fc-gap-1">
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
        <ThumbsUpIcon aria-label="Like" className="fc-h-4 fc-w-4" />
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
        <ThumbsDownIcon aria-label="Dislike" className="fc-h-4 fc-w-4" />
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
  const { comment, editorRef, setEdit } = useCommentContext();

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
              "fc-opacity-0 group-hover:fc-opacity-100 data-[state=open]:fc-bg-accent data-[state=open]:fc-opacity-100",
          })
        )}
      >
        <MoreVerticalIcon className="fc-h-4 fc-w-4" />
      </MenuTrigger>
      <MenuItems
        onCloseAutoFocus={(e) => {
          editorRef.current?.commands.focus("end");
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

function getTextFromContent(content: JSONContent): string {
  if (content.type === "text") return content.text ?? "";
  const child = (content.content?.map((c) => getTextFromContent(c)) ?? [])
    .join("")
    .trimEnd();

  if (content.type === "paragraph") return `${child}\n`;
  return child;
}
