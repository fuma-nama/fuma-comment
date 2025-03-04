import useSWRMutation from "swr/mutation";
import { SendIcon } from "lucide-react";
import {
  type FormHTMLAttributes,
  forwardRef,
  useCallback,
  useRef,
  useState,
} from "react";
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
import { updateCommentList } from "../../utils/comment-list";
import { syncComments } from "../../utils/comment-manager";

export const CreateForm = forwardRef<
  HTMLFormElement,
  FormHTMLAttributes<HTMLFormElement>
>((props, ref) => {
  const auth = useAuthContext();
  const { page } = useCommentsContext();
  const [isEmpty, setIsEmpty] = useState(true);
  const editorRef = useRef<UseCommentEditor | undefined>(undefined);
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
      onSuccess: (data) => {
        updateCommentList([data.page, data.threadId], (v) =>
          v ? [data, ...v] : undefined,
        );
        syncComments([data]);
        editorRef.current?.commands.clearContent(true);
      },
      revalidate: false,
    },
  );
  const disabled = mutation.isMutating || auth.session === null;

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
    <form ref={ref} onSubmit={onSubmit} {...props}>
      <div className="relative">
        <CommentEditor
          editorRef={editorRef}
          disabled={disabled}
          onChange={useCallback((v: UseCommentEditor) => {
            setIsEmpty(v.isEmpty);
          }, [])}
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
});

CreateForm.displayName = "CreateForm";
