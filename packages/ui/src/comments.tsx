import useSWR from "swr";
import type { Comment } from "server";
import { CommentEditor } from "./editor";
import { fetcher } from "./utils/fetcher";

export function Comments(): JSX.Element {
  const query = useSWR("/api/comments", (key) => fetcher<Comment[]>(key));

  return (
    <div className="fc-bg-background fc-text-foreground fc-p-4 fc-rounded-xl fc-border fc-border-border">
      <p className="fc-font-bold fc-mb-4">Comments</p>
      <CommentEditor />
      <div className="fc-flex fc-flex-col fc-mt-4 fc-border-t fc-border-border fc-pt-4">
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
      className="fc-flex fc-flex-row fc-gap-2 fc-rounded-xl fc-text-sm fc-p-3 -fc-mx-3 fc-transition-colors hover:fc-bg-card"
      {...props}
    >
      <div className="fc-flex fc-items-center fc-justify-center fc-w-7 fc-h-7 fc-rounded-full fc-bg-gradient-to-br fc-from-blue-600 fc-to-red-600">
        F
      </div>
      <div>
        <p className="fc-font-semibold fc-mb-2">Fuma</p>
        <p>{props.children}</p>
      </div>
    </div>
  );
}
