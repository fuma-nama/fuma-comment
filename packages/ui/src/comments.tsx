import useSWR from "swr";
import type { Comment } from "server";
import { useEffect, useState } from "react";
import { Menu } from "@headlessui/react";
import useSWRMutation from "swr/mutation";
import { CommentEditor } from "./editor";
import { fetcher } from "./utils/fetcher";
import { toLocalString } from "./utils/date";
import { MenuItem, MenuItems, MenuTrigger } from "./components/menu";

export function Comments(): JSX.Element {
  const query = useSWR("/api/comments", (key) => fetcher<Comment[]>(key));

  return (
    <div className="fc-bg-background fc-text-foreground fc-p-4 fc-rounded-xl fc-border fc-border-border">
      <p className="fc-font-bold fc-mb-4">Comments</p>
      <CommentEditor />
      <div className="fc-flex fc-flex-col fc-gap-2 fc-mt-4 fc-border-t fc-border-border fc-pt-4">
        {query.data?.map((comment) => (
          <CommentCard key={comment.id} {...comment} />
        ))}
      </div>
    </div>
  );
}

function CommentCard(props: Comment): JSX.Element {
  const [timestamp, setTimestamp] = useState("");
  const deleteMutation = useSWRMutation("/api/comments", (key) =>
    fetcher(`${key}/${props.id}`, { method: "DELETE" })
  );

  const onDelete = (): void => {
    void deleteMutation.trigger();
  };

  useEffect(() => {
    const parsed = new Date(props.timestamp);
    setTimestamp(toLocalString(parsed));
  }, [props.timestamp]);

  return (
    <div className="fc-group fc-relative fc-flex fc-flex-row fc-gap-2 fc-rounded-xl fc-text-sm fc-p-3 -fc-mx-3 hover:fc-bg-card">
      <div className="fc-flex fc-items-center fc-justify-center fc-w-7 fc-h-7 fc-rounded-full fc-bg-gradient-to-br fc-from-blue-600 fc-to-red-600">
        F
      </div>
      <div className="fc-flex-1">
        <p className="fc-inline-flex fc-gap-2 fc-items-center fc-mb-2">
          <span className="fc-font-semibold">{props.author}</span>
          <span className="fc-text-muted-foreground fc-text-xs">
            {timestamp}
          </span>
        </p>
        <p>{props.content}</p>
      </div>
      <Menu>
        <MenuTrigger className="fc-inline-flex fc-items-center fc-justify-center fc-w-6 fc-h-6 fc-rounded-full fc-opacity-0 group-hover:fc-opacity-100 data-[headlessui-state=open]:fc-bg-accent data-[headlessui-state=open]:fc-opacity-100">
          <svg
            className="fc-w-4 fc-h-4"
            fill="none"
            height="24"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="24"
          >
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </MenuTrigger>
        <MenuItems>
          <MenuItem>Edit</MenuItem>
          <MenuItem
            disabled={deleteMutation.isMutating}
            onClick={onDelete}
            type="button"
          >
            Delete
          </MenuItem>
        </MenuItems>
      </Menu>
    </div>
  );
}