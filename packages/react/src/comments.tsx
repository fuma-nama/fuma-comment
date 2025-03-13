import type { HTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "./utils/cn";
import {
	CommentsProvider,
	CommentsPost,
	CommentsList,
	type CommentsProviderProps,
} from "./atom";

export type CommentsProps = Omit<
	HTMLAttributes<HTMLDivElement>,
	keyof CommentsProviderProps | keyof InnerProps
> &
	CommentsProviderProps &
	InnerProps;

interface InnerProps {
	title?: ReactNode;

	/**
	 * title to show when the user has not logged in.
	 *
	 * Fallbacks to default `title` when not specified.
	 */
	titleUnauthorized?: ReactNode;
}

export const Comments = forwardRef<HTMLDivElement, CommentsProps>(
	(
		{ page, className, title, storage, mention, auth, apiUrl, ...props },
		ref,
	) => {
		return (
			<CommentsProvider
				page={page}
				apiUrl={apiUrl}
				auth={auth}
				storage={storage}
				mention={mention}
			>
				<div
					className={cn(
						"overflow-hidden rounded-xl border border-fc-border bg-fc-background text-fc-foreground",
						className,
					)}
					ref={ref}
					{...props}
				>
					<Inner title={title} />
					<CommentsList />
				</div>
			</CommentsProvider>
		);
	},
);

function Inner(props: InnerProps): ReactNode {
	return (
		<div className="relative flex flex-col gap-2">
			{props.title}
			<CommentsPost />
		</div>
	);
}

Comments.displayName = "Comments";
