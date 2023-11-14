"use client";
import { signIn, useSession } from "next-auth/react";
import { AuthLayout, Comments } from "ui";

export function CommentsWithAuth(): JSX.Element {
  const session = useSession();

  const id = session.data?.user?.email;

  return (
    <AuthLayout
      session={id ? { id } : null}
      signIn={() => void signIn("github")}
      status={session.status}
    >
      <Comments />
    </AuthLayout>
  );
}
