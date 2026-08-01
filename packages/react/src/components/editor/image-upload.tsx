import type { Editor } from "@tiptap/react";
import { useState } from "react";
import useSWRMutation from "swr/mutation";
import { useStorage } from "../../contexts/storage";
import { useObjectURL } from "../../utils/hooks";
import { cn } from "../../utils/cn";
import { Spinner } from "../spinner";
import { buttonVariants } from "../button";
import { toggleVariants, useHookUpdate } from ".";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "../dialog";
import { ImageIcon } from "lucide-react";
import { useId } from "react";
import { useTranslations } from "@fuma-translate/react";

export default function UploadImageButton({ editor }: { editor: Editor }): React.ReactElement {
	const t = useTranslations({ note: "image upload" });
	useHookUpdate(editor);
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<DialogTrigger
				type="button"
				aria-label={t("Upload image", { note: "aria-label" })}
				className={cn(toggleVariants())}
				disabled={editor.isDestroyed || !editor.isEditable || !editor.can().setImage({ src: "" })}
			>
				<ImageIcon className="size-4" />
			</DialogTrigger>
			<DialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
				<DialogTitle>{t("Upload image")}</DialogTitle>
				<DialogDescription>{t("Attach your own image to the comment.")}</DialogDescription>
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
	const t = useTranslations({ note: "image upload" });
	const storage = useStorage();
	const [file, setFile] = useState<Blob | null>(null);
	const fileUrl = useObjectURL(file);
	const id = useId();
	const mutation = useSWRMutation(
		"fc-upload-image",
		(_, { arg }: { arg: { file: Blob } }) => storage.upload(arg.file),
		{
			onSuccess(data) {
				editor.commands.setImage({
					src: data.url,
					alt: data.alt ?? t("Uploaded image", { note: "image alt text" }),
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
				id={id}
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
					htmlFor={id}
				>
					{mutation.isMutating ? (
						<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-xs backdrop-blur-lg backdrop-brightness-50">
							<Spinner className="size-8" />
							{t("Uploading")}
						</div>
					) : null}
					<img
						alt={t("Image preview", { note: "image alt text" })}
						className="mx-auto max-h-96"
						src={fileUrl}
					/>
				</label>
			) : (
				<label
					className="cursor-pointer rounded-xl border border-fc-border bg-fc-background p-4 text-center text-sm font-medium text-fc-muted-foreground"
					htmlFor={id}
				>
					{t("Upload image")}
				</label>
			)}

			<div className="mt-4 flex gap-1">
				<button className={cn(buttonVariants())} disabled={mutation.isMutating} type="submit">
					{t("Save")}
				</button>
			</div>
		</form>
	);
}
