import {
	Editor,
	type EditorOptions,
	Extension,
	type Node,
	ReactRenderer,
} from "@tiptap/react";
import { Document } from "@tiptap/extension-document";
import { Dropcursor } from "@tiptap/extension-dropcursor";
import { Gapcursor } from "@tiptap/extension-gapcursor";
import { Bold } from "@tiptap/extension-bold";
import { Strike } from "@tiptap/extension-strike";
import { Code } from "@tiptap/extension-code";
import { Link } from "@tiptap/extension-link";
import { Italic } from "@tiptap/extension-italic";
import { History } from "@tiptap/extension-history";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Text } from "@tiptap/extension-text";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Image } from "@tiptap/extension-image";
import { Mention } from "@tiptap/extension-mention";
import {
	codeBlockVariants,
	codeVariants,
	mentionVariants,
} from "../comment/content-renderer";
import { MentionList, type MentionListRef } from "./mention";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { lowlight } from "../../utils/highlighter";

const ImageWithWidth = Image.extend({
	addAttributes() {
		return {
			src: {
				isRequired: true,
				default: null,
			},
			width: {
				isRequired: true,
				default: null,
			},
			height: {
				isRequired: true,
				default: null,
			},
			alt: {
				default: "My Image",
			},
		};
	},
});

export type CreateEditorOptions = Partial<EditorOptions> & {
	placeholder?: string;
	mentionEnabled: boolean;

	onSubmit: () => boolean;
	onEscape: () => boolean;
};

function createMention(): Node {
	return Mention.configure({
		HTMLAttributes: {
			class: mentionVariants(),
		},
		deleteTriggerWithBackspace: true,
		suggestion: {
			placement: "bottom-start",
			render() {
				let component: ReactRenderer;
				let unmount: (() => void) | undefined;

				return {
					onStart(props) {
						component = new ReactRenderer(MentionList, {
							props,
							editor: props.editor,
						});

						unmount = props.mount(component.element);
					},
					onUpdate(props) {
						component.updateProps(props);
					},

					onKeyDown(props) {
						if (props.event.key === "Escape") {
							return true;
						}

						return (component.ref as MentionListRef).onKeyDown(props.event);
					},

					onExit() {
						unmount?.();
						component.destroy();
					},
				};
			},
		},
	});
}

export function createEditor({
	onSubmit,
	onEscape,
	mentionEnabled,
	...options
}: CreateEditorOptions): Editor {
	return new Editor({
		...options,
		extensions: [
			Document,
			Dropcursor,
			Gapcursor,
			Bold,
			Strike,
			Code.configure({
				HTMLAttributes: {
					class: codeVariants(),
				},
			}),
			Link.extend({ inclusive: false }).configure({
				openOnClick: false,
			}),
			Italic,
			History,
			Paragraph,
			ImageWithWidth,
			CodeBlockLowlight.configure({
				lowlight,
				defaultLanguage: "plaintext",
				HTMLAttributes: {
					class: codeBlockVariants(),
				},
			}),
			Text,
			Placeholder.configure({
				placeholder: options.placeholder,
				showOnlyWhenEditable: false,
			}),
			...(mentionEnabled ? [createMention()] : []),
			Extension.create({
				addKeyboardShortcuts() {
					return {
						Tab: () => {
							return this.editor.commands.insertContent("\t");
						},
						"Mod-Enter": onSubmit,
						Escape: onEscape,
					};
				},
			}),
			...(options.extensions ?? []),
		],
	});
}
