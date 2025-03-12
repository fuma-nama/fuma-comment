"use client";
import { Comments } from "@fuma-comment/react";
import { createAuthClient } from "better-auth/client";
const authClient = createAuthClient();

const signIn = () => {
	void authClient.signIn.social({
		provider: "github",
	});
};

export function Demo() {
	return (
		<Comments
			page="default"
			className="max-w-[800px] w-full"
			auth={{
				type: "api",
				signIn,
			}}
		/>
	);
}
