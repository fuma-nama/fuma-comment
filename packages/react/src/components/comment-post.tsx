import useSWRMutation from "swr/mutation";
import { SendIcon } from "lucide-react";
import { useAuthContext } from "../contexts/auth";
import { cn } from "../utils/cn";
import {
  type FetcherError,
  getCommentsKey,
  postComment,
} from "../utils/fetcher";
import { useCommentsContext } from "../contexts/comments";
import { buttonVariants } from "./button";
import { CommentEditor, useCommentEditor } from "./editor";
import { Spinner } from "./spinner";

export function CommentPost(): JSX.Element {
  const auth = useAuthContext();
  const { page } = useCommentsContext();
  const [editor, setEditor] = useCommentEditor();
  const mutation = useSWRMutation(
    getCommentsKey(undefined, page),
    (key, { arg }: { arg: { content: string } }) =>
      postComment({
        thread: key[1],
        page: key[2],
        ...arg,
      }),
    {
      onSuccess: () => {
        editor?.clearValue();
      },
    }
  );
  const disabled = mutation.isMutating || auth.status !== "authenticated";

  const submit = (): void => {
    if (!editor) return;
    const content = editor.getValue();

    if (content.length === 0) return;
    void mutation.trigger({ content });
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    submit();
    e.preventDefault();
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="fc-relative">
        <CommentEditor
          disabled={disabled}
          editor={editor}
          onChange={setEditor}
          onSubmit={submit}
          placeholder="Leave comment"
        />
        <button
          aria-label="Send Comment"
          className={cn(
            buttonVariants({
              className: "fc-absolute fc-right-2 fc-bottom-1.5",
              size: "icon",
            })
          )}
          disabled={disabled || (editor?.isEmpty ?? true)}
          type="submit"
        >
          {mutation.isMutating ? (
            <Spinner />
          ) : (
            <SendIcon className="fc-h-4 fc-w-4" />
          )}
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
