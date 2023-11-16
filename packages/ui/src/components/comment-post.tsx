import type { Editor } from "@tiptap/react";
import { useCallback, useEffect } from "react";
import useSWRMutation from "swr/mutation";
import { useAuthContext } from "../contexts/auth";
import { cn } from "../utils/cn";
import { fetcher, getCommentsKey } from "../utils/fetcher";
import { buttonVariants } from "./button";
import {
  getEditorContent,
  useCommentEditor,
  CommentEditor,
  type UseCommentEditorProps,
} from "./editor";
import { Spinner } from "./spinner";

interface CommentPostProps extends UseCommentEditorProps {
  thread?: number;
  className?: string;
}

export function CommentPost({
  thread,
  placeholder = "Leave comment",
  className,
  ...props
}: CommentPostProps): JSX.Element {
  const auth = useAuthContext();
  const mutation = useSWRMutation(
    getCommentsKey(thread),
    (key, { arg }: { arg: { content: string } }) =>
      fetcher(key[0], {
        method: "POST",
        body: JSON.stringify({
          thread: key[1],
          ...arg,
        }),
      })
  );

  const submit = useCallback(
    (instance: Editor) => {
      const content = getEditorContent(instance.getJSON());

      if (content.length === 0) return;
      void mutation.trigger(
        { content },
        {
          onSuccess: () => {
            instance.commands.clearContent();
          },
        }
      );
    },
    [mutation]
  );

  const editor = useCommentEditor({ placeholder, onSubmit: submit, ...props });
  const disabled = mutation.isMutating;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    if (editor === null) return;
    submit(editor);
    e.preventDefault();
  };

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  return (
    <form
      className={cn("fc-relative fc-flex fc-flex-col", className)}
      onSubmit={onSubmit}
    >
      {auth.status === "authenticated" && editor ? (
        <>
          <SendButton editor={editor} loading={mutation.isMutating} />
          <CommentEditor aria-disabled={disabled} editor={editor} />
        </>
      ) : (
        <>
          <Placeholder>{placeholder}</Placeholder>
          {auth.status === "unauthenticated" && (
            <div className="fc-mt-2">
              <AuthButton />
            </div>
          )}
        </>
      )}
    </form>
  );
}

function AuthButton(): JSX.Element {
  const { signIn } = useAuthContext();

  if (typeof signIn === "function")
    return (
      <button className={cn(buttonVariants())} onClick={signIn} type="button">
        Sign In
      </button>
    );

  return <>{signIn}</>;
}

function Placeholder({ children }: { children: string }): JSX.Element {
  return (
    <div aria-disabled className="primary-editor">
      <div className="tiptap fc-text-sm fc-text-muted-foreground">
        {children}
      </div>
    </div>
  );
}

function SendButton({
  editor,
  loading,
}: {
  editor: Editor;
  loading: boolean;
}): JSX.Element {
  return (
    <button
      aria-label="Send Comment"
      className={cn(
        buttonVariants({
          className: "fc-absolute fc-right-2 fc-bottom-2 fc-z-10",
          size: "icon",
        })
      )}
      disabled={loading || editor.isEmpty}
      type="submit"
    >
      {loading ? (
        <Spinner />
      ) : (
        <svg
          className="fc-w-4 fc-h-4"
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
  );
}
