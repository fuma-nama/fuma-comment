import type { Editor } from "@tiptap/react";
import { EmojiPicker } from "frimousse";
import { Smile } from "lucide-react";
import { useState } from "react";
import { cn } from "../../utils/cn";
import { useHookUpdate, toggleVariants } from ".";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "../dialog";
import { inputVariants } from "../input";

export default function EmojiPickerPopover({
	editor,
}: {
	editor: Editor;
}): React.ReactElement {
	useHookUpdate(editor);
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<DialogTrigger
				type="button"
				aria-label="Add Emoji"
				className={cn(toggleVariants())}
				disabled={!editor.isEditable}
			>
				<Smile className="size-4" />
			</DialogTrigger>
			<DialogContent
				full
				onCloseAutoFocus={(e) => {
					editor.commands.focus();
					e.preventDefault();
				}}
			>
				<DialogTitle className="sr-only">插入表情符號</DialogTitle>
				<EmojiPicker.Root
					className="flex w-full flex-col h-[368px] isolate max-sm:-mt-3"
					onEmojiSelect={(emoji) => {
						editor.chain().insertContent(emoji.emoji).focus().run();
						setIsOpen(false);
					}}
				>
					<EmojiPicker.Search
						placeholder="搜尋表情符號"
						type="text"
						className={cn(
							inputVariants({
								variant: "ghost",
							}),
						)}
					/>
					<EmojiPicker.Viewport className="relative flex-1 outline-hidden">
						<EmojiPicker.Loading className="absolute inset-0 flex items-center justify-center text-fc-muted-foreground text-sm">
							Loading…
						</EmojiPicker.Loading>
						<EmojiPicker.Empty className="absolute inset-0 flex items-center justify-center text-fc-muted-foreground text-sm">
							No emoji found.
						</EmojiPicker.Empty>
						<EmojiPicker.List
							className="select-none pb-1.5"
							components={{
								CategoryHeader: ({ category, ...props }) => (
									<div
										className="px-4 pt-3 pb-1.5 font-medium text-fc-muted-foreground bg-fc-popover text-xs"
										{...props}
									>
										{category.label}
									</div>
								),
								Row: ({ children, ...props }) => (
									<div className="scroll-my-1.5 px-1.5" {...props}>
										{children}
									</div>
								),
								Emoji: ({ emoji, ...props }) => (
									<button
										className="flex size-11 items-center justify-center rounded-md text-3xl data-[active]:bg-fc-accent"
										{...props}
									>
										{emoji.emoji}
									</button>
								),
							}}
						/>
					</EmojiPicker.Viewport>
				</EmojiPicker.Root>
			</DialogContent>
		</Dialog>
	);
}
