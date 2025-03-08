"use client";

import {
	useMemo,
	type ReactNode,
	type HTMLAttributes,
	forwardRef,
} from "react";
import { CommentsProvider as Provider } from "./contexts/comments";
import {
	AuthProvider,
	type AuthOptions,
	useAuthContext,
} from "./contexts/auth";
import { buttonVariants } from "./components/button";
import { cn } from "./utils/cn";
import { CreateForm } from "./components/comment/create-form";
import { CommentList } from "./components/comment/list";
import { type MentionOptions, MentionProvider } from "./contexts/mention";
import { type StorageContext, StorageProvider } from "./contexts/storage";

export interface CommentsProviderProps {
	/**
	 * Comments will be grouped by `page`
	 */
	page: string;

	auth: AuthOptions;

	mention?: MentionOptions;

	storage?: StorageContext;

	children?: ReactNode;
}

export function CommentsProvider({
	page,
	children,
	mention,
	storage,
	auth,
}: CommentsProviderProps): React.ReactNode {
	let child = children;
	const context = useMemo(
		() => ({
			page,
		}),
		[page],
	);

	if (mention)
		child = <MentionProvider mention={mention}>{child}</MentionProvider>;

	if (storage)
		child = <StorageProvider storage={storage}>{child}</StorageProvider>;

	return (
		<AuthProvider page={page} auth={auth}>
			<Provider value={context}>{child}</Provider>
		</AuthProvider>
	);
}

export const CommentsPost = CreateForm;

export const CommentsList = forwardRef<
	HTMLDivElement,
	HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
	return (
		<div className={cn("flex flex-col", className)} ref={ref} {...props}>
			<CommentList />
		</div>
	);
});

CommentsList.displayName = "CommentsList";

export function AuthButton(): React.ReactNode {
	const { signIn } = useAuthContext();

	if (typeof signIn === "function")
		return (
			<button className={cn(buttonVariants())} onClick={signIn} type="button">
				Sign In
			</button>
		);

	return signIn;
}

export { Comment } from "./components/comment/index";
export { ContentRenderer } from "./components/comment/content-renderer";
