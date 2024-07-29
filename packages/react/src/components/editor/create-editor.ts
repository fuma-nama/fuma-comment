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
import tippy, { type Instance } from "tippy.js";
import { codeVariants, mentionVariants } from "../comment/content-renderer";
import type { MentionContextType } from "../../contexts/mention";
import { MentionList, type MentionListRef } from "./mention";

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
  mention: MentionContextType;

  onSubmit: () => boolean;
  onEscape: () => boolean;
};

function createMention(ctx: MentionContextType): Node {
  const query = ctx.query;
  return Mention.configure({
    HTMLAttributes: {
      class: mentionVariants(),
    },
    deleteTriggerWithBackspace: true,
    suggestion: {
      items(props) {
        return query(props.query);
      },
      render() {
        let component: ReactRenderer;
        let popup: Instance[];

        return {
          onStart(props) {
            component = new ReactRenderer(MentionList, {
              props,
              editor: props.editor,
            });

            const clientRect = props.clientRect;
            if (!clientRect) return;

            popup = tippy("body", {
              getReferenceClientRect: () =>
                props.clientRect?.() ?? new DOMRect(0, 0),
              appendTo: () => document.body,
              content: component.element,
              showOnCreate: true,
              interactive: true,
              trigger: "manual",
              placement: "bottom-start",
            });
          },
          onUpdate(props) {
            component.updateProps(props);
          },

          onKeyDown(props) {
            if (props.event.key === "Escape") {
              popup[0].hide();

              return true;
            }

            return (component.ref as MentionListRef).onKeyDown(props.event);
          },

          onExit() {
            popup[0].destroy();
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
  mention,
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
      ...(mention.enabled ? [createMention(mention)] : []),
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
