"use client";

import { Comments } from "@fuma-comment/react";

const signIn = () => {
	window.location.href = `/api/comments/oauth/login?return=${encodeURIComponent(window.location.href)}`;
};

export function Demo() {
	return (
		<Comments
			page="demo"
			className="max-w-[800px] w-full"
			apiUrl="/api/comments"
			mention={{ enabled: true }}
			auth={{ type: "api", signIn }}
		/>
	);
}
