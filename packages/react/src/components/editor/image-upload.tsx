import type { Editor } from "@tiptap/react";
import { useState } from "react";
import useSWRMutation from "swr/mutation";
import { useStorage } from "../../contexts/storage";
import { useObjectURL } from "../../utils/hooks";
import { cn } from "../../utils/cn";
import { Spinner } from "../spinner";
import { buttonVariants } from "../button";
import { toggleVariants, useHookUpdate } from ".";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from "../dialog";
import { ImageIcon } from "lucide-react";

export default function UploadImageButton({
	editor,
}: { editor: Editor }): React.ReactElement {
	useHookUpdate(editor);
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<DialogTrigger
				type="button"
				aria-label="Upload Image"
				className={cn(toggleVariants())}
				disabled={!editor.can().setImage({ src: "" }) || !editor.isEditable}
			>
				<ImageIcon className="size-4" />
			</DialogTrigger>
			<DialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
				<DialogTitle>Upload Image</DialogTitle>
				<DialogDescription>Attach your own image to comment.</DialogDescription>
				<UploadImage
					editor={editor}
					onClose={() => {
						setIsOpen(false);
						editor.commands.focus();
					}}
				/>
			</DialogContent>
		</Dialog>
	);
}

function UploadImage({
	editor,
	onClose,
}: {
	editor: Editor;
	onClose: () => void;
}): React.ReactElement {
	const storage = useStorage();
	const [file, setFile] = useState<Blob | null>(null);
	const fileUrl = useObjectURL(file);
	const mutation = useSWRMutation(
		"fc-upload-image",
		(_, { arg }: { arg: { file: Blob } }) => storage.upload(arg.file),
		{
			onSuccess(data) {
				editor.commands.setImage({
					src: data.url,
					alt: data.alt,
					// @ts-expect-error -- add width, height properties
					width: data.width,
					height: data.height,
				});
				onClose();
			},
		},
	);

	return (
		<form
			className="flex flex-col"
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();

				if (file) {
					void mutation.trigger({ file });
				}
			}}
		>
			<input
				accept="image/png, image/jpeg"
				hidden
				id="image"
				onChange={(e) => {
					if (e.target.files && e.target.files.length > 0) {
						setFile(e.target.files.item(0));
					}
				}}
				type="file"
				disabled={mutation.isMutating}
			/>
			{fileUrl ? (
				<label
					className={cn(
						"relative overflow-hidden rounded-xl border border-fc-border bg-fc-muted",
						mutation.isMutating ? "cursor-not-allowed" : "cursor-pointer",
					)}
					htmlFor="image"
				>
					{mutation.isMutating ? (
						<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-xs backdrop-blur-lg backdrop-brightness-50">
							<Spinner className="size-8" />
							Uploading
						</div>
					) : null}
					<img alt="preview" className="mx-auto max-h-96" src={fileUrl} />
				</label>
			) : (
				<label
					className="cursor-pointer rounded-xl border border-fc-border bg-fc-background p-4 text-center text-sm font-medium text-fc-muted-foreground"
					htmlFor="image"
				>
					Upload Image
				</label>
			)}

			<div className="mt-2 flex gap-1">
				<button
					className={cn(buttonVariants())}
					disabled={mutation.isMutating}
					type="submit"
				>
					Save
				</button>
			</div>
		</form>
	);
}
