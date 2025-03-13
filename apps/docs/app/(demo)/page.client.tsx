"use client";
import { signIn } from "next-auth/react";
import type { CommentsProps } from "@fuma-comment/react";
import { Comments } from "@fuma-comment/react";
import { createUploadThingStorage } from "@fuma-comment/react/uploadthing";

const storage = createUploadThingStorage();

export function CommentsWithAuth(props: Omit<CommentsProps, "auth">) {
	return (
		<Comments
			storage={storage}
			mention={{
				enabled: true,
			}}
			auth={{
				type: "api",
				signIn: () => void signIn("github"),
			}}
			{...props}
		/>
	);
}
