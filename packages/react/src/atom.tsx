"use client";

import {
	useMemo,
	type ReactNode,
	type HTMLAttributes,
	forwardRef,
	type ButtonHTMLAttributes,
} from "react";
import { CommentsProvider as Provider } from "./contexts/comments";
import {
	AuthProvider,
	type AuthOptions,
	useAuthContext,
} from "./contexts/auth";
import { cn } from "./utils/cn";
import { CreateForm } from "./components/comment/create-form";
import { CommentList } from "./components/comment/list";
import { type MentionOptions, MentionProvider } from "./contexts/mention";
import { type StorageContext, StorageProvider } from "./contexts/storage";
import { createFetcher } from "./utils/fetcher";

export interface CommentsProviderProps {
	/**
	 * 評論將按 `page` 分組
	 */
	page: string;

	auth: AuthOptions;

	mention?: MentionOptions;

	storage?: StorageContext;

	/**
	 * API 端點的 URL。
	 *
	 * 如果未指定，API 將從 `/api/comments` 獲取。
	 */
	apiUrl?: string;

	children?: ReactNode;
}

export function CommentsProvider({
	page,
	children,
	mention,
	storage,
	auth,
	apiUrl,
}: CommentsProviderProps): React.ReactNode {
	let child = children;
	const context = useMemo(
		() => ({
			page,
			fetcher: createFetcher(apiUrl),
		}),
		[page, apiUrl],
	);

	if (mention)
		child = <MentionProvider mention={mention}>{child}</MentionProvider>;

	if (storage)
		child = <StorageProvider storage={storage}>{child}</StorageProvider>;

	return (
		<Provider value={context}>
			<AuthProvider page={page} auth={auth}>
				{child}
			</AuthProvider>
		</Provider>
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

export function AuthButton(
	props: ButtonHTMLAttributes<HTMLButtonElement>,
): React.ReactNode {
	const { signIn } = useAuthContext();

	if (typeof signIn === "function")
		return (
			<button {...props} onClick={signIn} type="button">
				{props.children ?? "登入"}
			</button>
		);

	return signIn;
}

export { Comment } from "./components/comment/index";
export { ContentRenderer } from "./components/comment/content-renderer";
