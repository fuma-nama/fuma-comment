import {
  lowlight
} from "./chunk-B5523HTG.js";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  inputVariants,
  toggleVariants,
  useHookUpdate
} from "./chunk-WUBP3NTF.js";
import {
  SquareCode,
  twMerge
} from "./chunk-5NN7OVAV.js";
import {
  __objRest,
  __spreadProps,
  __spreadValues
} from "./chunk-BBZEL7EG.js";

// src/components/editor/codeblock.tsx
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem
} from "cmdk";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
function CodeBlockButton({
  editor
}) {
  const [isOpen, setIsOpen] = useState(false);
  useHookUpdate(editor);
  return /* @__PURE__ */ jsxs(Dialog, { onOpenChange: setIsOpen, open: isOpen, children: [
    /* @__PURE__ */ jsx(
      DialogTrigger,
      {
        type: "button",
        "aria-label": "Toggle CodeBlock",
        className: twMerge(toggleVariants({ active: editor.isActive("codeBlock") })),
        children: /* @__PURE__ */ jsx(SquareCode, { className: "size-4" })
      }
    ),
    /* @__PURE__ */ jsxs(
      DialogContent,
      {
        className: "p-0 overflow-hidden",
        onCloseAutoFocus: (e) => e.preventDefault(),
        children: [
          /* @__PURE__ */ jsx(DialogTitle, { className: "sr-only", children: "Insert CodeBlock" }),
          /* @__PURE__ */ jsx(CodeBlockForm, { editor, onClose: () => setIsOpen(false) })
        ]
      }
    )
  ] });
}
function CodeBlockForm(_a) {
  var _b = _a, {
    editor,
    onClose
  } = _b, props = __objRest(_b, [
    "editor",
    "onClose"
  ]);
  const [value, setValue] = useState(
    () => editor.getAttributes("codeBlock").language
  );
  return /* @__PURE__ */ jsxs(Command, __spreadProps(__spreadValues({}, props), { children: [
    /* @__PURE__ */ jsx(
      CommandInput,
      {
        className: twMerge(inputVariants({ variant: "ghost" }), "w-full"),
        placeholder: "\u641C\u5C0B\u8A9E\u8A00...",
        value,
        onValueChange: setValue
      }
    ),
    /* @__PURE__ */ jsxs(CommandList, { className: "h-[300px] overflow-auto", children: [
      /* @__PURE__ */ jsx(CommandEmpty, { className: "absolute inset-0 flex items-center justify-center text-fc-muted-foreground text-sm", children: "\u6C92\u6709\u627E\u5230\u8A9E\u8A00" }),
      /* @__PURE__ */ jsx(CommandGroup, { children: lowlight.listLanguages().map((item) => /* @__PURE__ */ jsx(
        CommandItem,
        {
          value: item,
          onSelect: (value2) => {
            editor.chain().setCodeBlock({
              language: value2
            }).focus().run();
            onClose();
          },
          className: "px-4 py-1.5 aria-selected:bg-fc-accent aria-selected:text-fc-accent-foreground",
          children: item
        },
        item
      )) })
    ] })
  ] }));
}
export {
  CodeBlockButton as default
};
