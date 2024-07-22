import { Editor, type EditorOptions, Extension } from "@tiptap/react";
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
import { codeVariants } from "../comment/content-renderer";

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

  onSubmit: () => boolean;
  onEscape: () => boolean;
};

export function createEditor({
  onSubmit,
  onEscape,
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
      Text,
      Placeholder.configure({
        placeholder: options.placeholder,
        showOnlyWhenEditable: false,
      }),
      Extension.create({
        addKeyboardShortcuts() {
          return {
            "Mod-Enter": onSubmit,
            Escape: onEscape,
          };
        },
      }),
      ...(options.extensions ?? []),
    ],
  });
}
