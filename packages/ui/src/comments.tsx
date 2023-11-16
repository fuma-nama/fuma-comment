import useSWR from "swr";
import type { SerializedComment } from "server";
import { fetcher, getCommentsKey } from "./utils/fetcher";
import { Spinner } from "./components/spinner";
import { Comment } from "./components/comment";
import { CommentPost } from "./components/comment-post";

export function Comments(): JSX.Element {
  const query = useSWR(getCommentsKey(), ([key]) =>
    fetcher<SerializedComment[]>(key)
  );

  return (
    <div className="fc-bg-background fc-text-foreground fc-p-4 fc-rounded-xl fc-border fc-border-border">
      <p className="fc-font-bold fc-mb-4">Comments</p>
      <CommentPost />
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
