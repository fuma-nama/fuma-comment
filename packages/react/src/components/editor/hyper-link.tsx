import type { Editor } from "@tiptap/react";
import { useLayoutEffect, useState } from "react";
import { useLatestCallback } from "../../utils/hooks";
import { cn } from "../../utils/cn";
import { inputVariants } from "../input";
import { buttonVariants } from "../button";

export function HyperLink({
	editor,
	onClose,
}: {
	editor: Editor;
	onClose: () => void;
}): React.ReactElement {
	const [name, setName] = useState("");
	const [value, setValue] = useState("");

	useLayoutEffect(() => {
		editor.commands.extendMarkRange("link");

		const href = editor.getAttributes("link").href as string | undefined;
		const selection = editor.state.selection;
		const selected = editor.state.doc.textBetween(selection.from, selection.to);

		setName(selected);
		setValue(href ?? "");
	}, [editor]);

	const unset = useLatestCallback(() => {
		onClose();
		editor.chain().focus().unsetMark("link").run();
	});

	const onSubmit = useLatestCallback((e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		e.stopPropagation();

		if (value.trim().length === 0) return;
		const content = name.length > 0 ? name : value;

		onClose();
		if (!editor.state.selection.empty) {
			editor
				.chain()
				.deleteSelection()
				.setLink({ href: value })
				.insertContent(content)
				.focus()
				.run();
		} else {
			editor
				.chain()
				.setLink({ href: value })
				.insertContent(content)
				.unsetMark("link")
				.insertContent(" ")
				.focus()
				.run();
		}
	});

	return (
		<form className="flex flex-col gap-1" onSubmit={onSubmit}>
			<input
				className={cn(inputVariants())}
				id="name"
				onChange={(e) => {
					setName(e.target.value);
				}}
				placeholder="Name (optional)"
				value={name}
			/>
			<input
				className={cn(inputVariants())}
				id="url"
				onChange={(e) => {
					setValue(e.target.value);
				}}
				placeholder="URL"
				required
				type="url"
				value={value}
			/>
			<div className="mt-2 flex gap-1">
				<button className={cn(buttonVariants())} type="submit">
					Save
				</button>
				{editor.isActive("link") ? (
					<button
						className={cn(buttonVariants({ variant: "secondary" }))}
						onClick={unset}
						type="button"
					>
						Unset
					</button>
				) : null}
			</div>
		</form>
	);
}
