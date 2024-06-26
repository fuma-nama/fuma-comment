import useSWRMutation from "swr/mutation";
import { SendIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useAuthContext } from "../../contexts/auth";
import { cn } from "../../utils/cn";
import {
  type FetcherError,
  getCommentsKey,
  postComment,
} from "../../utils/fetcher";
import { useCommentsContext } from "../../contexts/comments";
import { useLatestCallback } from "../../utils/hooks";
import { buttonVariants } from "../button";
import { CommentEditor, type UseCommentEditor } from "../editor";
import { Spinner } from "../spinner";

export function CreateForm(): React.ReactElement {
  const auth = useAuthContext();
  const { page } = useCommentsContext();
  const [isEmpty, setIsEmpty] = useState(true);
  const editorRef = useRef<UseCommentEditor>();
  const mutation = useSWRMutation(
    getCommentsKey({
      page,
    }),
    (_, { arg }: { arg: { content: object } }) =>
      postComment({
        page,
        ...arg,
      }),
    {
      onSuccess: () => {
        editorRef.current?.commands.clearContent(true);
      },
    },
  );
  const disabled = mutation.isMutating || auth.status !== "authenticated";

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
      <div className="relative">
        <CommentEditor
          editorRef={editorRef}
          disabled={disabled}
          onChange={(v) => {
            setIsEmpty(v.isEmpty);
          }}
          onSubmit={submit}
          placeholder="Leave comment"
        />
        <button
          aria-label="Send Comment"
          className={cn(
            buttonVariants({
              className: "absolute right-2 bottom-1.5",
              size: "icon",
            }),
          )}
          disabled={disabled || isEmpty}
          type="submit"
        >
          {mutation.isMutating ? <Spinner /> : <SendIcon className="size-4" />}
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
