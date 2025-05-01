import {
  codeBlockVariants,
  codeVariants,
  mentionVariants
} from "./chunk-P3GC32AD.js";
import {
  lowlight
} from "./chunk-B5523HTG.js";
import {
  Spinner
} from "./chunk-SIPNGVYW.js";
import {
  twMerge,
  useCommentsContext,
  useMention
} from "./chunk-5NN7OVAV.js";
import {
  __objRest,
  __spreadProps,
  __spreadValues
} from "./chunk-BBZEL7EG.js";

// src/components/editor/create-editor.ts
import {
  Editor,
  Extension,
  ReactRenderer
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
import tippy from "tippy.js";

// src/components/editor/mention.tsx
import { forwardRef, useImperativeHandle, useState } from "react";
import useSWR from "swr";
import { jsx, jsxs } from "react/jsx-runtime";
var MentionList = forwardRef((props, ref) => {
  var _a, _b;
  const { page } = useCommentsContext();
  const ctx = useMention();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const query = useSWR(
    ["/api/comments/users", page, props.query],
    () => ctx.query(props.query, { page }),
    {
      keepPreviousData: true,
      onSuccess() {
        setSelectedIndex(0);
      }
    }
  );
  const selectItem = (index) => {
    var _a2;
    const item = (_a2 = query.data) == null ? void 0 : _a2.at(index);
    if (item) {
      props.command({ id: item.id, label: item.label });
    }
  };
  useImperativeHandle(ref, () => ({
    onKeyDown: (event) => {
      const items = query.data;
      if (event.key === "ArrowUp" && items) {
        setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
        return true;
      }
      if (event.key === "ArrowDown" && items) {
        setSelectedIndex((prev) => (prev + 1) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    }
  }));
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col overflow-hidden rounded-lg border border-fc-border bg-fc-popover text-sm text-fc-popover-foreground shadow-lg", children: [
    (_a = query.data) == null ? void 0 : _a.map((item, index) => /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        className: twMerge(
          "px-3 py-1.5 text-left font-medium",
          index === selectedIndex && "bg-fc-primary text-fc-primary-foreground"
        ),
        onClick: () => {
          selectItem(index);
        },
        children: item.label
      },
      item.id
    )),
    ((_b = query.data) == null ? void 0 : _b.length) === 0 && /* @__PURE__ */ jsx("p", { className: "p-3 text-fc-muted-foreground", children: "No result" }),
    !query.data ? /* @__PURE__ */ jsxs("div", { className: "flex flex-row items-center gap-1.5 p-3 text-fc-muted-foreground", children: [
      /* @__PURE__ */ jsx(Spinner, { className: "size-4" }),
      "Loading"
    ] }) : null
  ] });
});
MentionList.displayName = "MentionList";

// src/components/editor/create-editor.ts
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
var ImageWithWidth = Image.extend({
  addAttributes() {
    return {
      src: {
        isRequired: true,
        default: null
      },
      width: {
        isRequired: true,
        default: null
      },
      height: {
        isRequired: true,
        default: null
      },
      alt: {
        default: "My Image"
      }
    };
  }
});
function createMention() {
  return Mention.configure({
    HTMLAttributes: {
      class: mentionVariants()
    },
    deleteTriggerWithBackspace: true,
    suggestion: {
      render() {
        let component;
        let popup;
        return {
          onStart(props) {
            component = new ReactRenderer(MentionList, {
              props,
              editor: props.editor
            });
            const clientRect = props.clientRect;
            if (!clientRect) return;
            popup = tippy("body", {
              getReferenceClientRect: () => {
                var _a, _b;
                return (_b = (_a = props.clientRect) == null ? void 0 : _a.call(props)) != null ? _b : new DOMRect(0, 0);
              },
              appendTo: () => document.body,
              content: component.element,
              showOnCreate: true,
              interactive: true,
              trigger: "manual",
              placement: "bottom-start"
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
            return component.ref.onKeyDown(props.event);
          },
          onExit() {
            popup[0].destroy();
            component.destroy();
          }
        };
      }
    }
  });
}
function createEditor(_a) {
  var _b = _a, {
    onSubmit,
    onEscape,
    mentionEnabled
  } = _b, options = __objRest(_b, [
    "onSubmit",
    "onEscape",
    "mentionEnabled"
  ]);
  var _a2;
  return new Editor(__spreadProps(__spreadValues({}, options), {
    extensions: [
      Document,
      Dropcursor,
      Gapcursor,
      Bold,
      Strike,
      Code.configure({
        HTMLAttributes: {
          class: codeVariants()
        }
      }),
      Link.extend({ inclusive: false }).configure({
        openOnClick: false
      }),
      Italic,
      History,
      Paragraph,
      ImageWithWidth,
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: "plaintext",
        HTMLAttributes: {
          class: codeBlockVariants()
        }
      }),
      Text,
      Placeholder.configure({
        placeholder: options.placeholder,
        showOnlyWhenEditable: false
      }),
      ...mentionEnabled ? [createMention()] : [],
      Extension.create({
        addKeyboardShortcuts() {
          return {
            "Mod-Enter": onSubmit,
            Escape: onEscape
          };
        }
      }),
      ...(_a2 = options.extensions) != null ? _a2 : []
    ]
  }));
}
export {
  createEditor
};
