import useSWR from "swr";
import type { SerializedComment } from "server";
import { useCommentContext } from "../contexts/comment";
import { fetcher } from "../utils/fetcher";
// eslint-disable-next-line import/no-cycle -- in function
import { Comment } from "./comment";
import { CommentPost } from "./comment-post";

export function CommentReplies(): JSX.Element {
  const { comment } = useCommentContext();
  const query = useSWR(["/api/comments", comment.id], (key) =>
    fetcher<SerializedComment[]>(`${key[0]}?thread=${key[1]}`)
  );

  return (
    <div className="fc-pl-4 fc-mt-4">
      <CommentPost placeholder="Reply to comment" thread={comment.id} />
      {query.data?.map((reply) => <Comment comment={reply} key={reply.id} />)}
    </div>
  );
}
