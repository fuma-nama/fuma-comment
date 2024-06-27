import { useState, useMemo, useLayoutEffect, useCallback, useRef } from "react";
import type { SerializedComment } from "@fuma-comment/server";
import useSWRMutation from "swr/mutation";
import { cva } from "cva";
import { ChevronDown, MoreVertical, ThumbsDown, ThumbsUp } from "lucide-react";
import { type JSONContent } from "@tiptap/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import { cn } from "../../utils/cn";
import { toLocalString } from "../../utils/date";
import { fetcher, getCommentsKey } from "../../utils/fetcher";
import {
  type CommentContext,
  useCommentContext,
  CommentProvider,
} from "../../contexts/comment";
import { useAuthContext } from "../../contexts/auth";
import {
  onCommentDeleted,
  onLikeUpdated,
  useCommentManager,
} from "../../utils/comment-manager";
import { useLatestCallback } from "../../utils/hooks";
import { MenuTrigger, MenuItems, MenuItem, Menu } from "../menu";
import { buttonVariants } from "../button";
import type { UseCommentEditor } from "../editor";
import { Dialog, DialogContent, DialogTrigger } from "../dialog";
import { EditForm } from "./edit-form";
import { ReplyForm, ReplyHeader } from "./reply-form";
import { ContentRenderer } from "./content-renderer";
import { CommentList } from "./list";

export function Comment({
  comment: cached,
}: {
  comment: SerializedComment;
}): React.ReactElement {
  const [timestamp, setTimestamp] = useState("");
  const [edit, setEdit] = useState(false);
  const [isReply, setIsReply] = useState(false);
  const editorRef = useRef<UseCommentEditor>();
  const comment = useCommentManager(cached.id) ?? cached;

  const context = useMemo<CommentContext>(() => {
    return {
      isEditing: edit,
      isReplying: isReply,
      setEdit,
      editorRef,
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
          "relative flex flex-row gap-2 px-3 py-4 text-sm",
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
            <EditForm />
          ) : (
            <>
              <ContentRenderer content={comment.content} />
              <CommentActions />
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

function CommentActions(): React.ReactNode {
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
      {!comment.threadId && isAuthenticated ? (
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

function CommentMenu(): React.ReactNode {
  const { session } = useAuthContext();
  const { comment, editorRef, isEditing, isReplying, setEdit } =
    useCommentContext();

  const deleteMutation = useSWRMutation(
    getCommentsKey({
      thread: comment.threadId,
    }),
    ([key]) => fetcher(`${key}/${comment.id}`, { method: "DELETE" }),
    {
      onSuccess() {
        onCommentDeleted(comment);
      },
      revalidate: false,
    },
  );

  const canEdit = session !== null && session.id === comment.author.id;
  const canDelete =
    session !== null &&
    (session.permissions?.delete || session.id === comment.author.id);

  const onCopy = useCallback(() => {
    const text = getTextFromContent(comment.content as JSONContent);

    void navigator.clipboard.writeText(text);
  }, [comment.content]);

  const onEdit = useCallback(() => {
    setEdit(true);
  }, [setEdit]);

  const onDelete = useCallback((): void => {
    void deleteMutation.trigger();
  }, [deleteMutation]);

  return (
    <Menu>
      <MenuTrigger
        aria-label="Open Menu"
        className={cn(
          buttonVariants({
            size: "icon",
            variant: "ghost",
            className:
              "ml-auto text-fc-muted-foreground data-[state=open]:bg-fc-accent data-[state=open]:text-fc-accent-foreground disabled:invisible",
          }),
        )}
        disabled={isEditing || isReplying}
      >
        <MoreVertical className="size-4" />
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

function CommentReplies(): React.ReactElement {
  const { comment } = useCommentContext();
  const [open, setOpen] = useState(false);

  return (
    <Collapsible
      className="border-y border-fc-border bg-fc-card pl-3"
      open={open}
      onOpenChange={setOpen}
    >
      <CollapsibleTrigger
        className={cn(
          buttonVariants({
            variant: "ghost",
            size: "medium",
            className: "gap-3.5",
          }),
        )}
      >
        <ChevronDown
          className={cn(
            "-ml-0.5 size-4 transition-transform",
            open && "rotate-180",
          )}
        />
        {comment.replies} Replies
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-fc-accordion-up data-[state=open]:animate-fc-accordion-down">
        <CommentList threadId={comment.id} />
      </CollapsibleContent>
    </Collapsible>
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
