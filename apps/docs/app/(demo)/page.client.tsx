"use client";
import { signIn, useSession } from "next-auth/react";
import type { StorageContext, CommentsProps } from "@fuma-comment/react";
import { Comments, AuthProvider, StorageProvider } from "@fuma-comment/react";

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUDNAME;

const storage: StorageContext = {
  enabled: true,
  async upload(file) {
    const body = new FormData();
    body.append("file", file);
    body.append("upload_preset", "fuma_comment");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body,
      },
    );

    if (res.ok) {
      const result = (await res.json()) as {
        secure_url: string;
        width: number;
        height: number;
      };

      return {
        url: result.secure_url,
        width: result.width,
        height: result.height,
      };
    }

    throw new Error("Failed to upload file");
  },
};

export function CommentsWithAuth(props: CommentsProps): JSX.Element {
  const session = useSession();
  const id = session.data?.user?.id;

  return (
    <AuthProvider
      session={id ? { id } : null}
      signIn={() => void signIn("github")}
      status={session.status}
    >
      <StorageProvider storage={storage}>
        <Comments {...props} />
      </StorageProvider>
    </AuthProvider>
  );
}
