import useSWRMutation from "swr/mutation";
import { cn } from "../utils/cn";
import { editComment, getCommentsKey } from "../utils/fetcher";
import { useCommentContext } from "../contexts/comment";
import { updateComment } from "../utils/comment-manager";
import { buttonVariants } from "./button";
import { getEditorContent, useCommentEditor, CommentEditor } from "./editor";
import { Spinner } from "./spinner";

export function CommentEdit(): JSX.Element {
  const { comment, setEdit } = useCommentContext();

  const mutation = useSWRMutation(
    getCommentsKey(comment.threadId),
    (_, { arg }: { arg: { id: number; content: string } }) => editComment(arg)
  );

  const onClose = (): void => {
    setEdit(false);
  };

  const submit = (): void => {
    if (!editor.current) return;
    const content = getEditorContent(editor.current.getJSON());

    if (content.length === 0) return;
    void mutation.trigger(
      { id: comment.id, content },
      {
        revalidate: false,
        onSuccess: () => {
          updateComment(comment.id, (c) => ({ ...c, content }));
          onClose();
        },
      }
    );
  };

  const disabled = mutation.isMutating;
  const editor = useCommentEditor({
    disabled,
    placeholder: "Edit Message",
    defaultValue: comment.content,
    onSubmit: submit,
    onEscape: onClose,
    autofocus: "all",
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    submit();
    e.preventDefault();
  };

  return (
    <form onSubmit={onSubmit}>
      <CommentEditor
        className="fc-rounded-md fc-border fc-border-border fc-bg-background"
        editor={editor.current}
        variant="secondary"
      />
      <div className="fc-mt-2 fc-flex fc-flex-row fc-gap-1">
        <button
          aria-label="Edit"
          className={cn(
            buttonVariants({ variant: "primary", className: "fc-gap-2" })
          )}
          disabled={disabled || editor.current?.isEmpty}
          type="submit"
        >
          {mutation.isMutating ? (
            <Spinner />
          ) : (
            <svg
              className="fc-h-4 fc-w-4"
              fill="none"
              height="24"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="24"
            >
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          )}
          Edit
        </button>
        <button
          className={cn(buttonVariants({ variant: "secondary" }))}
          onClick={onClose}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
