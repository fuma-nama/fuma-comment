import { getServerSession } from "next-auth";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

export const uploadRouter = {
	imageUploader: f({
		image: {
			maxFileSize: "8MB",
			maxFileCount: 1,
		},
	})
		.middleware(async () => {
			const session = await getServerSession();

			if (!session?.user?.email) throw new UploadThingError("Unauthorized");

			return { userId: session.user.email };
		})
		.onUploadComplete(async ({ metadata }) => {
			return { uploadedBy: metadata.userId };
		}),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
