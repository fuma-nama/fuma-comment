import useSWRMutation from "swr/mutation";
import { cn } from "../utils/cn";
import {
  type FetcherError,
  getCommentsKey,
  postComment,
} from "../utils/fetcher";
import { useCommentContext } from "../contexts/comment";
import { onCommentReplied } from "../utils/comment-manager";
import { useCommentsContext } from "../contexts/comments";
import { buttonVariants } from "./button";
import { getEditorContent, useCommentEditor, CommentEditor } from "./editor";
import { Spinner } from "./spinner";

export function CommentReply(): JSX.Element {
  const placeholder = "Reply to comment";
  const { page } = useCommentsContext();
  const { comment, setReply } = useCommentContext();

  const mutation = useSWRMutation(
    getCommentsKey(comment.id, page),
    (key, { arg }: { arg: { content: string } }) =>
      postComment({
        thread: key[1],
        page: key[2],
        ...arg,
      }),
    {
      onSuccess: () => {
        onCommentReplied(comment.id);
        onClose();
      },
    }
  );

  const onClose = (): void => {
    setReply(false);
  };

  const disabled = mutation.isMutating;

  const submit = (): void => {
    if (!editor.current) return;
    const content = getEditorContent(editor.current.getJSON());

    if (content.length === 0) return;
    void mutation.trigger({ content });
  };

  const editor = useCommentEditor({
    placeholder,
    autofocus: true,
    onSubmit: submit,
    onEscape: onClose,
    disabled,
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    submit();
    e.preventDefault();
  };

  return (
    <form className="fc-mt-2" onSubmit={onSubmit}>
      <CommentEditor editor={editor.current} placeholder={placeholder} />
      <div className="fc-mt-2 fc-flex fc-flex-row fc-gap-1">
        <button
          className={cn(buttonVariants({ className: "fc-gap-2" }))}
          disabled={disabled || !editor.current || editor.current.isEmpty}
          type="submit"
        >
          {mutation.isMutating ? <Spinner /> : null}
          Reply
        </button>
        <button
          className={cn(
            buttonVariants({
              variant: "secondary",
            })
          )}
          onClick={onClose}
          type="button"
        >
          Cancel
        </button>
      </div>
      {mutation.error ? (
        <p className="fc-mt-1 fc-text-sm fc-text-error">
          {(mutation.error as FetcherError).message}
        </p>
      ) : null}
    </form>
  );
}
