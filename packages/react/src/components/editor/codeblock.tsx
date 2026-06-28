import type { Editor } from "@tiptap/react";
import { SquareCode } from "lucide-react";
import {
	useEffect,
	useEffectEvent,
	useMemo,
	useState,
	type ComponentProps,
} from "react";
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
				aria-label="Toggle CodeBlock"
				className={cn(toggleVariants({ active: editor.isActive("codeBlock") }))}
			>
				<SquareCode className="size-4" />
			</DialogTrigger>
			<DialogContent full onCloseAutoFocus={(e) => e.preventDefault()}>
				<DialogTitle className="sr-only">Insert CodeBlock</DialogTitle>
				<CodeBlockForm editor={editor} onClose={() => setIsOpen(false)} />
			</DialogContent>
		</Dialog>
	);
}

function CodeBlockForm({
	editor,
	onClose,
	...props
}: ComponentProps<"div"> & { editor: Editor; onClose: () => void }) {
	const [search, setSearch] = useState<string>(
		() => editor.getAttributes("codeBlock").language ?? "",
	);
	const [selected, setSelected] = useState<string | undefined>(
		() => editor.getAttributes("codeBlock").language,
	);

	const items = useMemo(() => {
		const normalized = search.toLowerCase();

		return lowlight
			.listLanguages()
			.filter((item) => item.toLowerCase().includes(normalized));
	}, [search]);

	function onSelect(value: string) {
		editor
			.chain()
			.setCodeBlock({
				language: value,
			})
			.focus()
			.run();
		onClose();
	}

	const listener = useEffectEvent((event: KeyboardEvent) => {
		if (items.length === 0) return;

		if (event.key === "ArrowUp") {
			const idx = selected ? items.indexOf(selected) : -1;

			setSelected(idx === -1 ? items[0] : items[idx - 1]);
			event.preventDefault();
			return true;
		}

		if (event.key === "ArrowDown") {
			const idx = selected ? items.indexOf(selected) : -1;

			setSelected(idx === -1 ? items[0] : items[idx + 1]);
			event.preventDefault();
			return true;
		}

		if (event.key === "Enter" && selected) {
			onSelect(selected);
			event.preventDefault();
			return true;
		}
	});

	useEffect(() => {
		window.addEventListener("keydown", listener);
		return () => window.removeEventListener("keydown", listener);
	}, []);

	if (items.length > 0 && (!selected || !items.includes(selected))) {
		setSelected(items[0]);
	}

	return (
		<div {...props}>
			<input
				className={cn(inputVariants({ variant: "ghost" }), "w-full")}
				placeholder="Search language..."
				value={search}
				onChange={(e) => setSearch(e.target.value)}
			/>
			<div className="relative text-sm h-[300px] overflow-auto">
				{items.length === 0 && (
					<div className="absolute inset-0 flex items-center justify-center text-fc-muted-foreground">
						No language found.
					</div>
				)}
				<ul>
					{items.map((item) => (
						<li
							key={item}
							ref={(element) => {
								if (selected === item) {
									element?.scrollIntoView();
								}
							}}
							onClick={() => onSelect(item)}
							onPointerEnter={() => setSelected(item)}
							aria-selected={selected === item}
							className="px-4 py-1.5 font-mono aria-selected:bg-fc-accent aria-selected:text-fc-accent-foreground"
						>
							{item}
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
