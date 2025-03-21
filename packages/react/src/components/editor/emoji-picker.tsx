import type { Editor } from "@tiptap/react";
import { EmojiPicker } from "frimousse";
import { Smile } from "lucide-react";
import { useState } from "react";
import { cn } from "../../utils/cn";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { useHookUpdate, toggleVariants } from ".";

export default function EmojiPickerPopover({
	editor,
}: { editor: Editor }): React.ReactElement {
	useHookUpdate(editor);
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen}>
			<PopoverTrigger
				type="button"
				aria-label="Add Emoji"
				className={cn(toggleVariants())}
				disabled={!editor.isEditable}
			>
				<Smile className="size-4" />
			</PopoverTrigger>
			<PopoverContent
				className="isolate flex h-[368px] w-full flex-col p-0"
				onCloseAutoFocus={(e) => e.preventDefault()}
				asChild
			>
				<EmojiPicker.Root
					onEmojiSelect={(emoji) => {
						editor.chain().insertContent(emoji.emoji).focus().run();
						setIsOpen(false);
					}}
				>
					<EmojiPicker.Search className="appearance-none px-3 py-2.5 outline-none border-b placeholder:text-fc-muted-foreground" />
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
										className="px-3 pt-3 pb-1.5 font-medium text-fc-muted-foreground bg-fc-popover text-xs"
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
										className="flex size-8 items-center justify-center rounded-md text-lg data-[active]:bg-fc-accent"
										{...props}
									>
										{emoji.emoji}
									</button>
								),
							}}
						/>
					</EmojiPicker.Viewport>
				</EmojiPicker.Root>
			</PopoverContent>
		</Popover>
	);
}
