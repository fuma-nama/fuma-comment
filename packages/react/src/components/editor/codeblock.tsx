import type { Editor } from "@tiptap/react";
import {
	Command,
	CommandInput,
	CommandList,
	CommandEmpty,
	CommandGroup,
	CommandItem,
} from "cmdk";
import { SquareCode } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { useHookUpdate, toggleVariants } from ".";
import { cn } from "../../utils/cn";
import { lowlight } from "../../utils/highlighter";
import { inputVariants } from "../input";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "../dialog";

export default function CodeBlockButton({
	editor,
}: {
	editor: Editor;
}): React.ReactNode {
	const [isOpen, setIsOpen] = useState(false);
	useHookUpdate(editor);

	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<DialogTrigger
				type="button"
				aria-label="切換程式碼區塊"
				className={cn(toggleVariants({ active: editor.isActive("codeBlock") }))}
			>
				<SquareCode className="size-4" />
			</DialogTrigger>
			<DialogContent full onCloseAutoFocus={(e) => e.preventDefault()}>
				<DialogTitle className="sr-only">插入程式碼區塊</DialogTitle>
				<CodeBlockForm editor={editor} onClose={() => setIsOpen(false)} />
			</DialogContent>
		</Dialog>
	);
}

function CodeBlockForm({
	editor,
	onClose,
	...props
}: ComponentProps<typeof Command> & { editor: Editor; onClose: () => void }) {
	const [value, setValue] = useState(
		() => editor.getAttributes("codeBlock").language,
	);

	return (
		<Command {...props}>
			<CommandInput
				className={cn(inputVariants({ variant: "ghost" }), "w-full")}
				placeholder="搜尋語言..."
				value={value}
				onValueChange={setValue}
			/>
			<CommandList className="h-[300px] overflow-auto">
				<CommandEmpty className="absolute inset-0 flex items-center justify-center text-fc-muted-foreground text-sm">
					找不到語言。
				</CommandEmpty>
				<CommandGroup>
					{lowlight.listLanguages().map((item) => (
						<CommandItem
							key={item}
							value={item}
							onSelect={(value) => {
								editor
									.chain()
									.setCodeBlock({
										language: value,
									})
									.focus()
									.run();
								onClose();
							}}
							className="px-4 py-1.5 aria-selected:bg-fc-accent aria-selected:text-fc-accent-foreground"
						>
							{item}
						</CommandItem>
					))}
				</CommandGroup>
			</CommandList>
		</Command>
	);
}
