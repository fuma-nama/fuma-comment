import useSWR from "swr";
import type { SerializedComment } from "server";
import { fetcher, getCommentsKey } from "./utils/fetcher";
import { Spinner } from "./components/spinner";
import { Comment } from "./components/comment";
import { CommentPost } from "./components/comment-post";
import { buttonVariants } from "./components/button";
import { useAuthContext } from "./contexts/auth";
import { cn } from "./utils/cn";
import { syncComments } from "./utils/comment-manager";

interface CommentsProps {
  page?: string;
}

export function Comments(props: CommentsProps): JSX.Element {
  const auth = useAuthContext();
  const query = useSWR(
    getCommentsKey(undefined, props.page),
    ([key, _, page]) => {
      const params = new URLSearchParams();

      if (page) params.append("page", page);
      return fetcher<SerializedComment[]>(`${key}?${params.toString()}`);
    },
    {
      onSuccess(data) {
        syncComments(data);
      },
    }
  );

  return (
    <div className="fc-bg-background fc-text-foreground fc-p-4 fc-rounded-xl fc-border fc-border-border">
      <p className="fc-font-bold fc-mb-4">Comments</p>
      <CommentPost />
      {auth.status === "unauthenticated" && (
        <div className="fc-mt-2">
          <AuthButton />
        </div>
      )}
      <div className="fc-flex fc-flex-col fc-mt-4 fc-border-t fc-border-border fc-pt-4">
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
