import useSWRMutation from "swr/mutation";
import { useRef, useState } from "react";
import { cn } from "../../utils/cn";
import {
  type FetcherError,
  getCommentsKey,
  postComment,
} from "../../utils/fetcher";
import { useCommentContext } from "../../contexts/comment";
import { onCommentReplied } from "../../utils/comment-manager";
import { useCommentsContext } from "../../contexts/comments";
import { useLatestCallback } from "../../utils/hooks";
import { buttonVariants } from "../button";
import { CommentEditor, type UseCommentEditor } from "../editor";
import { Spinner } from "../spinner";
import { DialogTitle } from "../dialog";
import { toLocalString } from "../../utils/date";
import { Avatar } from "../avatar";
import { ContentRenderer } from "./content-renderer";

export function ReplyHeader() {
  const { comment } = useCommentContext();

  return (
    <>
      <DialogTitle>Replying to {comment.author.name}</DialogTitle>
      <div className="mb-2 flex flex-col gap-4 rounded-xl border border-fc-border p-3 text-sm">
        <div className="flex flex-row items-center gap-2 text-xs text-fc-muted-foreground">
          <Avatar
            className="size-6"
            placeholder={comment.author.name}
            image={comment.author.image}
          />
          <span>{toLocalString(new Date(comment.timestamp))}</span>
        </div>
        <ContentRenderer content={comment.content} />
      </div>
    </>
  );
}

export function ReplyForm() {
  const { page } = useCommentsContext();
  const [isEmpty, setIsEmpty] = useState(true);
  const editorRef = useRef<UseCommentEditor>();
  const { comment, setReply } = useCommentContext();

  const mutation = useSWRMutation(
    getCommentsKey({
      thread: comment.id,
      page,
    }),
    (_, { arg }: { arg: { content: object } }) =>
      postComment({
        thread: comment.id,
        page,
        ...arg,
      }),
    {
      revalidate: false,
      onSuccess(data) {
        onCommentReplied(data);
        setReply(false);
      },
    },
  );

  const onClose = useLatestCallback(() => {
    setReply(false);
  });

  const disabled = mutation.isMutating;

  const submit = useLatestCallback(() => {
    if (!editorRef.current) return;
    const content = editorRef.current.getJSON();

    if (content.length === 0) return;
    void mutation.trigger({ content });
  });

  const onSubmit = useLatestCallback((e: React.FormEvent<HTMLFormElement>) => {
    submit();
    e.preventDefault();
  });

  return (
    <form onSubmit={onSubmit}>
      <CommentEditor
        autofocus
        disabled={disabled}
        editorRef={editorRef}
        onChange={(v) => {
          setIsEmpty(v.isEmpty);
        }}
        onEscape={onClose}
        onSubmit={submit}
        placeholder="Reply to comment"
      />
      <div className="mt-2 flex flex-row gap-1">
        <button
          className={cn(buttonVariants({ className: "gap-2" }))}
          disabled={disabled || isEmpty}
          type="submit"
        >
          {mutation.isMutating ? <Spinner /> : null}
          Reply
        </button>
        <button
          className={cn(
            buttonVariants({
              variant: "secondary",
            }),
          )}
          onClick={onClose}
          type="button"
        >
          Cancel
        </button>
      </div>
      {mutation.error ? (
        <p className="mt-1 text-sm text-fc-error">
          {(mutation.error as FetcherError).message}
        </p>
      ) : null}
    </form>
  );
}
