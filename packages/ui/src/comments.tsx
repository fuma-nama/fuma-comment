import useSWR from "swr";
import type { Comment } from "server";
import { CommentEditor } from "./editor";
import { fetcher } from "./utils/fetcher";

export function Comments(): JSX.Element {
  const query = useSWR("/api/comments", (key) => fetcher<Comment[]>(key));

  return (
    <div className="fc-bg-background fc-p-4 fc-rounded-xl fc-border fc-border-border">
      <p className="fc-font-bold fc-mb-4">Comments</p>
      <CommentEditor />
      <div className="fc-flex fc-flex-col fc-gap-2 fc-mt-4 fc-border-t fc-border-border fc-pt-4">
        {query.data?.map((comment) => (
          <CommentCard key={comment.id}>{comment.content}</CommentCard>
        ))}
      </div>
    </div>
  );
}

function CommentCard(props: { children: string }): JSX.Element {
  return (
    <div
      className="fc-rounded-xl fc-text-sm fc-p-3 fc-bg-card fc-border fc-border-border"
      {...props}
    >
      <p className="fc-font-semibold fc-mb-2">Fuma</p>
      <p>{props.children}</p>
    </div>
  );
}
