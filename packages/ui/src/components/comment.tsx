import { Menu } from "@headlessui/react";
import { useState, useMemo, useLayoutEffect } from "react";
import type { SerializedComment } from "server";
import useSWRMutation from "swr/mutation";
import { cn } from "../utils/cn";
import { toLocalString } from "../utils/date";
import { fetcher } from "../utils/fetcher";
import {
  type CommentContext,
  useCommentContext,
  CommentProvider,
} from "../contexts/comment";
import { MenuTrigger, MenuItems, MenuItem } from "./menu";
import { CommentEdit } from "./comment-edit";

export function Comment({
  comment,
}: {
  comment: SerializedComment;
}): JSX.Element {
  const [timestamp, setTimestamp] = useState("");
  const [edit, setEdit] = useState(false);
  const deleteMutation = useSWRMutation("/api/comments", (key) =>
    fetcher(`${key}/${comment.id}`, { method: "DELETE" })
  );

  const context = useMemo<CommentContext>(() => {
    return {
      isDeleting: deleteMutation.isMutating,
      isEditing: edit,
      setEdit: (v) => {
        setEdit(v);
      },
      onDelete: () => {
        void deleteMutation.trigger();
      },
      comment,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Mutation object is always updated
  }, [comment, deleteMutation.isMutating, edit]);

  useLayoutEffect(() => {
    const parsed = new Date(comment.timestamp);
    setTimestamp(toLocalString(parsed));
  }, [comment.timestamp]);

  return (
    <CommentProvider value={context}>
      <div
        className={cn(
          "fc-group fc-relative fc-flex fc-flex-row fc-gap-2 fc-rounded-xl fc-text-sm fc-p-3 -fc-mx-3",
          edit ? "fc-bg-card" : "hover:fc-bg-card"
        )}
      >
        {comment.author.image ? (
          <img
            alt="avatar"
            className="fc-w-8 fc-h-8 fc-rounded-full fc-bg-card fc-select-none"
            height={32}
            src={comment.author.image}
            width={32}
          />
        ) : (
          <div className="fc-w-8 fc-h-8 fc-rounded-full fc-bg-gradient-to-br fc-from-blue-600 fc-to-red-600" />
        )}
        <div className="fc-flex-1">
          <p className="fc-inline-flex fc-gap-2 fc-items-center fc-mb-2">
            <span className="fc-font-semibold">{comment.author.name}</span>
            <span className="fc-text-muted-foreground fc-text-xs">
              {timestamp}
            </span>
          </p>
          {edit ? <CommentEdit /> : <p>{comment.content}</p>}
        </div>
        {!context.isEditing && <CommentMenu />}
      </div>
    </CommentProvider>
  );
}

function CommentMenu(): JSX.Element {
  const { isDeleting, onDelete, setEdit } = useCommentContext();

  const onEdit = (): void => {
    setEdit(true);
  };

  return (
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
        <MenuItem disabled={isDeleting} onClick={onDelete}>
          Delete
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}
