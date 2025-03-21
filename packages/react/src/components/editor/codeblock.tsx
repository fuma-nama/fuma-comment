import { Popover, PopoverTrigger, PopoverContent } from "../popover";
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

export default function CodeBlockButton({
	editor,
}: { editor: Editor }): React.ReactNode {
	const [isOpen, setIsOpen] = useState(false);
	useHookUpdate(editor);

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen}>
			<PopoverTrigger
				type="button"
				aria-label="Toggle CodeBlock"
				className={cn(toggleVariants({ active: editor.isActive("codeBlock") }))}
			>
				<SquareCode className="size-4" />
			</PopoverTrigger>
			<PopoverContent
				className="p-0"
				onCloseAutoFocus={(e) => e.preventDefault()}
				asChild
			>
				<CodeBlockForm editor={editor} onClose={() => setIsOpen(false)} />
			</PopoverContent>
		</Popover>
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
				placeholder="Search language..."
				value={value}
				onValueChange={setValue}
			/>
			<CommandList className="max-h-[300px] overflow-auto">
				<CommandEmpty>No language found.</CommandEmpty>
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
							className="px-3 py-1.5 text-sm aria-selected:bg-fc-accent aria-selected:text-fc-accent-foreground"
						>
							{item}
						</CommandItem>
					))}
				</CommandGroup>
			</CommandList>
		</Command>
	);
}
