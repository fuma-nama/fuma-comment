"use client";
import { ClerkProvider, SignInButton } from "@clerk/nextjs";
import { Comments } from "@fuma-comment/react";

export function CommentsWithAuth() {
  return (
    <ClerkProvider>
      <Comments
        page="default"
        mention={{
          enabled: true,
        }}
        auth={{
          type: "api",
          // function to sign in
          signIn: <SignInButton />,
        }}
      />
    </ClerkProvider>
  );
}
