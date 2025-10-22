import { Pencil } from "lucide-react";
import { type ReactNode, useCallback, useState } from "react";
import useSWRMutation from "swr/mutation";
import { useCommentContext } from "../../contexts/comment";
import { useCommentsContext } from "../../contexts/comments";
import { cn } from "../../utils/cn";
import { updateComment } from "../../utils/comment-manager";
import { getCommentsKey } from "../../utils/fetcher";
import { useLatestCallback } from "../../utils/hooks";
import { buttonVariants } from "../button";
import {
  CommentEditor,
  clearPersistentId,
  type UseCommentEditor,
} from "../editor";
import { Spinner } from "../spinner";

function EditForm({ onClose }: { onClose: () => void }): ReactNode {
  const [isEmpty, setIsEmpty] = useState(false);
  const { comment, editorRef } = useCommentContext();
  const { fetcher } = useCommentsContext();

  const mutation = useSWRMutation(
    getCommentsKey({
      page: comment.page,
      thread: comment.threadId,
    }),
    (_, { arg }: { arg: { content: object } }) =>
      fetcher.editComment({
        id: comment.id,
        page: comment.page,
        ...arg,
      }),
    {
      revalidate: false,
    },
  );

  const submit = useLatestCallback(() => {
    if (!editorRef.current) return;
    if (editorRef.current.isEmpty) return;

    const content = editorRef.current.getJSON();
    clearPersistentId(`edit-${comment.id}`);
    void mutation.trigger(
      { content },
      {
        onSuccess() {
          onClose();
          updateComment(comment.id, (item) => ({ ...item, content }));
        },
      },
    );
  });

  return (
    <form
      className="relative"
      onSubmit={(e) => {
        submit();
        e.preventDefault();
      }}
    >
      <CommentEditor
        persistentId={`edit-${comment.id}`}
        defaultValue={comment.content}
        disabled={mutation.isMutating}
        editorRef={editorRef}
        onChange={useCallback((v: UseCommentEditor) => {
          setIsEmpty(v.isEmpty);
        }, [])}
        onEscape={onClose}
        onSubmit={submit}
        placeholder="Edit Message"
      >
        <button
          aria-label="Edit"
          className={cn(
            buttonVariants({
              variant: "primary",
              size: "icon",
            }),
          )}
          disabled={mutation.isMutating || isEmpty}
          type="submit"
        >
          {mutation.isMutating ? <Spinner /> : <Pencil className="size-4" />}
        </button>
      </CommentEditor>
    </form>
  );
}

export { EditForm };
