import useSWR from "swr";
import type { SerializedComment } from "server";
import { useCallback, useContext, useEffect } from "react";
import useSWRMutation from "swr/mutation";
import type { Editor } from "@tiptap/react";
import { fetcher } from "./utils/fetcher";
import { Spinner } from "./components/spinner";
import { Comment } from "./components/comment";
import {
  CommentEditor,
  getEditorContent,
  useCommentEditor,
} from "./components/editor";
import { AuthContext } from "./contexts/auth";
import { buttonVariants } from "./components/button";
import { cn } from "./utils/cn";

export function Comments(): JSX.Element {
  const query = useSWR("/api/comments", (key) =>
    fetcher<SerializedComment[]>(key)
  );

  return (
    <div className="fc-bg-background fc-text-foreground fc-p-4 fc-rounded-xl fc-border fc-border-border">
      <p className="fc-font-bold fc-mb-4">Comments</p>
      <CommentPost />
      <div className="fc-flex fc-flex-col fc-gap-2 fc-mt-4 fc-border-t fc-border-border fc-pt-4">
        {query.isLoading ? (
          <Spinner className="fc-w-8 fc-h-8 fc-mx-auto" />
        ) : (
          query.data?.map((comment) => (
            <Comment comment={comment} key={comment.id} />
          ))
        )}
      </div>
    </div>
  );
}

function CommentPost(): JSX.Element {
  const auth = useContext(AuthContext);
  const mutation = useSWRMutation(
    "/api/comments",
    (key, { arg }: { arg: { content: string } }) =>
      fetcher(key, { method: "POST", body: JSON.stringify(arg) })
  );

  const submit = useCallback(
    (instance: Editor): boolean => {
      const content = getEditorContent(instance.getJSON());

      if (content.length === 0) return false;
      void mutation.trigger(
        { content },
        {
          onSuccess: () => {
            instance.commands.clearContent();
          },
        }
      );

      return true;
    },
    [mutation]
  );

  const editor = useCommentEditor({ onSubmit: submit });
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
    <form className="fc-relative fc-flex fc-flex-col" onSubmit={onSubmit}>
      {auth.status === "authenticated" && editor ? (
        <>
          <SendButton editor={editor} loading={mutation.isMutating} />
          <CommentEditor aria-disabled={disabled} editor={editor} />
        </>
      ) : (
        <>
          <Placeholder />
          <div className="fc-mt-2">
            {auth.status !== "authenticated" && <AuthButton />}
          </div>
        </>
      )}
    </form>
  );
}

function AuthButton(): JSX.Element {
  const { signIn } = useContext(AuthContext);

  if (typeof signIn === "function")
    return (
      <button className={cn(buttonVariants())} onClick={signIn} type="button">
        Sign In
      </button>
    );

  return <>{signIn}</>;
}

function Placeholder(): JSX.Element {
  return (
    <div aria-disabled className="primary-editor">
      <div className="tiptap fc-text-sm fc-text-muted-foreground">
        Leave comment
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
