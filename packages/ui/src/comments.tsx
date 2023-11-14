import useSWR from "swr";
import type { SerializedComment } from "server";
import { useEffect, useState } from "react";
import { Menu } from "@headlessui/react";
import useSWRMutation from "swr/mutation";
import { CommentEdit, CommentPost } from "./editor";
import { fetcher } from "./utils/fetcher";
import { toLocalString } from "./utils/date";
import { MenuItem, MenuItems, MenuTrigger } from "./components/menu";
import { cn } from "./utils/cn";
import { Spinner } from "./components/spinner";

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
            <CommentCard key={comment.id} {...comment} />
          ))
        )}
      </div>
    </div>
  );
}

function CommentCard(props: SerializedComment): JSX.Element {
  const [timestamp, setTimestamp] = useState("");
  const [edit, setEdit] = useState(false);
  const deleteMutation = useSWRMutation("/api/comments", (key) =>
    fetcher(`${key}/${props.id}`, { method: "DELETE" })
  );

  const onEdit = (): void => {
    setEdit((prev) => !prev);
  };

  const onDelete = (): void => {
    void deleteMutation.trigger();
  };

  useEffect(() => {
    const parsed = new Date(props.timestamp);
    setTimestamp(toLocalString(parsed));
  }, [props.timestamp]);

  return (
    <div
      className={cn(
        "fc-group fc-relative fc-flex fc-flex-row fc-gap-2 fc-rounded-xl fc-text-sm fc-p-3 -fc-mx-3",
        edit ? "fc-bg-card" : "hover:fc-bg-card"
      )}
    >
      {props.author.image ? (
        <img
          alt="avatar"
          className="fc-w-8 fc-h-8 fc-rounded-full"
          height={32}
          src={props.author.image}
          width={32}
        />
      ) : (
        <div className="fc-w-8 fc-h-8 fc-rounded-full fc-bg-gradient-to-br fc-from-blue-600 fc-to-red-600" />
      )}
      <div className="fc-flex-1">
        <p className="fc-inline-flex fc-gap-2 fc-items-center fc-mb-2">
          <span className="fc-font-semibold">{props.author.name}</span>
          <span className="fc-text-muted-foreground fc-text-xs">
            {timestamp}
          </span>
        </p>
        {edit ? (
          <CommentEdit
            defaultContent={props.content}
            id={props.id}
            onOpenChange={setEdit}
          />
        ) : (
          <p>{props.content}</p>
        )}
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
          <MenuItem onClick={onEdit}>Edit</MenuItem>
          <MenuItem disabled={deleteMutation.isMutating} onClick={onDelete}>
            Delete
          </MenuItem>
        </MenuItems>
      </Menu>
    </div>
  );
}
