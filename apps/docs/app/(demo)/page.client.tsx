"use client";
import { signIn, useSession } from "next-auth/react";
import {
  Comments,
  type CommentsProps,
  AuthProvider,
} from "@fuma-comment/react";

export function CommentsWithAuth(props: CommentsProps): JSX.Element {
  const session = useSession();
  const id = session.data?.user?.id;

  return (
    <AuthProvider
      session={id ? { id } : null}
      signIn={() => void signIn("github")}
      status={session.status}
    >
      <Comments {...props} />
    </AuthProvider>
  );
}
