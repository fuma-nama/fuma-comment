import { Menu } from "@headlessui/react";
import { useState, useMemo, useLayoutEffect } from "react";
import type { SerializedComment } from "server";
import useSWRMutation from "swr/mutation";
import { cva } from "cva";
import { useSWRConfig } from "swr";
import { cn } from "../utils/cn";
import { toLocalString } from "../utils/date";
import { fetcher, updateLikes } from "../utils/fetcher";
import {
  type CommentContext,
  useCommentContext,
  CommentProvider,
} from "../contexts/comment";
import { MenuTrigger, MenuItems, MenuItem } from "./menu";
import { CommentEdit } from "./comment-edit";
import { buttonVariants } from "./button";

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
          {edit ? (
            <CommentEdit />
          ) : (
            <>
              <p className="fc-whitespace-pre-wrap">{comment.content}</p>
              <CommentActions />
            </>
          )}
        </div>
        {!context.isEditing && <CommentMenu />}
      </div>
    </CommentProvider>
  );
}

const rateVariants = cva(
  buttonVariants({
    variant: "secondary",
    size: "small",
    className: "fc-gap-1.5",
  }),
  {
    variants: {
      active: {
        true: "fc-bg-accent fc-text-accent-foreground",
        false: "fc-text-muted-foreground",
      },
    },
  }
);

function CommentActions(): JSX.Element {
  const { comment } = useCommentContext();
  const { mutate } = useSWRConfig();

  const onRate = (v: boolean): void => {
    const value = v === comment.liked ? undefined : v;
    void fetcher(
      `/api/comments/${comment.id}/rate`,
      value === undefined
        ? {
            method: "DELETE",
          }
        : {
            method: "POST",
            body: JSON.stringify({ like: value }),
          }
    );

    updateLikes(mutate, comment.id, value);
  };

  return (
    <div className="fc-flex fc-flex-row fc-gap-1 fc-mt-2">
      <button
        className={cn(
          rateVariants({
            active: comment.liked === true,
          })
        )}
        onClick={() => {
          onRate(true);
        }}
        type="button"
      >
        <svg
          aria-label="Like"
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
          <path d="M7 10v12" />
          <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
        </svg>
        {comment.likes}
      </button>
      <button
        className={cn(
          rateVariants({
            active: comment.liked === false,
          })
        )}
        onClick={() => {
          onRate(false);
        }}
        type="button"
      >
        <svg
          aria-label="Dislike"
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
          <path d="M17 14V2" />
          <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
        </svg>
        {comment.dislikes}
      </button>
    </div>
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
