import useSWRMutation from "swr/mutation";
import { useAuthContext } from "../contexts/auth";
import { cn } from "../utils/cn";
import {
  type FetcherError,
  getCommentsKey,
  postComment,
} from "../utils/fetcher";
import { useCommentsContext } from "../contexts/comments";
import { buttonVariants } from "./button";
import { getEditorContent, useCommentEditor, CommentEditor } from "./editor";
import { Spinner } from "./spinner";

export function CommentPost(): JSX.Element {
  const placeholder = "Leave comment";
  const auth = useAuthContext();
  const { page } = useCommentsContext();
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
        editor.current?.commands.clearContent();
      },
    }
  );
  const disabled = mutation.isMutating || auth.status !== "authenticated";

  const submit = (): void => {
    if (!editor.current) return;
    const content = getEditorContent(editor.current.getJSON());

    if (content.length === 0) return;
    void mutation.trigger({ content });
  };

  const editor = useCommentEditor({
    placeholder,
    onSubmit: submit,
    disabled,
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    submit();
    e.preventDefault();
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="fc-relative">
        <CommentEditor editor={editor.current} placeholder={placeholder} />
        <button
          aria-label="Send Comment"
          className={cn(
            buttonVariants({
              className: "fc-absolute fc-right-2 fc-bottom-1.5",
              size: "icon",
            })
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
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
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
