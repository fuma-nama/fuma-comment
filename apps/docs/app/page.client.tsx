"use client";
import { signIn, useSession } from "next-auth/react";
import { Comments, AuthProvider } from "ui";

export function CommentsWithAuth(): JSX.Element {
  const session = useSession();
  const id = session.data?.user?.email;

  return (
    <AuthProvider
      session={id ? { id } : null}
      signIn={() => void signIn("github")}
      status={session.status}
    >
      <Comments />
    </AuthProvider>
  );
}
