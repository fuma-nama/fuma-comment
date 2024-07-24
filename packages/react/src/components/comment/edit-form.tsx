import useSWRMutation from "swr/mutation";
import { Pencil } from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "../../utils/cn";
import { editComment, getCommentsKey } from "../../utils/fetcher";
import { useCommentContext } from "../../contexts/comment";
import { updateComment } from "../../utils/comment-manager";
import { useLatestCallback } from "../../utils/hooks";
import { buttonVariants } from "../button";
import { CommentEditor, type UseCommentEditor } from "../editor";
import { Spinner } from "../spinner";

export function EditForm(): React.ReactNode {
  const [isEmpty, setIsEmpty] = useState(false);
  const { comment, editorRef, setEdit } = useCommentContext();

  const mutation = useSWRMutation(
    getCommentsKey({
      page: comment.page,
      thread: comment.threadId,
    }),
    (_, { arg }: { arg: { content: object } }) =>
      editComment({
        id: comment.id,
        page: comment.page,
        ...arg,
      }),
    {
      revalidate: false,
    },
  );

  const onClose = useLatestCallback(() => {
    setEdit(false);
  });

  const submit = useLatestCallback(() => {
    if (!editorRef.current) return;
    const content = editorRef.current.getJSON();

    if (content.length === 0) return;
    void mutation.trigger(
      { content },
      {
        onSuccess() {
          setEdit(false);
          updateComment(comment.id, (item) => ({ ...item, content }));
        },
      },
    );
  });

  const onSubmit = useLatestCallback((e: React.FormEvent<HTMLFormElement>) => {
    submit();
    e.preventDefault();
  });

  return (
    <form onSubmit={onSubmit}>
      <CommentEditor
        defaultValue={comment.content}
        disabled={mutation.isMutating}
        editorRef={editorRef}
        onChange={useCallback((v: UseCommentEditor) => {
          setIsEmpty(v.isEmpty);
        }, [])}
        onEscape={onClose}
        onSubmit={submit}
        placeholder="Edit Message"
      />
      <div className="mt-2 flex flex-row gap-1">
        <button
          aria-label="Edit"
          className={cn(
            buttonVariants({ variant: "primary", className: "gap-2" }),
          )}
          disabled={mutation.isMutating || isEmpty}
          type="submit"
        >
          {mutation.isMutating ? <Spinner /> : <Pencil className="size-4" />}
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
