'use client';
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/comments.tsx
import useSWR from "swr";
import { useEffect as useEffect2, useState } from "react";
import { Menu } from "@headlessui/react";
import useSWRMutation from "swr/mutation";

// src/editor.tsx
import useMutation from "swr/mutation";
import * as React from "react";
import {
  EditorContent,
  useEditor,
  Extension
} from "@tiptap/react";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Document } from "@tiptap/extension-document";
import { Dropcursor } from "@tiptap/extension-dropcursor";
import { Gapcursor } from "@tiptap/extension-gapcursor";
import { HardBreak } from "@tiptap/extension-hard-break";
import { History } from "@tiptap/extension-history";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Text } from "@tiptap/extension-text";

// src/utils/cn.ts
import { createTailwindMerge, getDefaultConfig } from "tailwind-merge";
var cn = createTailwindMerge(() => __spreadProps(__spreadValues({}, getDefaultConfig()), {
  prefix: "fc-"
}));

// src/utils/fetcher.ts
function fetcher(url, init) {
  return __async(this, null, function* () {
    const response = yield fetch(url, init);
    if (!response.ok)
      throw new Error(yield response.text());
    return yield response.json();
  });
}

// src/editor.tsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function CommentEditor() {
  const mutation = useMutation(
    "/api/comments",
    (key, { arg }) => fetcher(key, { method: "POST", body: JSON.stringify(arg) })
  );
  const editor = useEditor({
    extensions: [
      Document,
      Dropcursor,
      Gapcursor,
      HardBreak,
      History,
      Paragraph,
      Text,
      Placeholder.configure({ placeholder: "Leave comment" }),
      Extension.create({
        addKeyboardShortcuts() {
          return {
            "Shift-Enter": () => {
              submit(this.editor);
              return true;
            }
          };
        }
      })
    ]
  });
  const submit = React.useCallback(
    (instance) => {
      const content = flatten(instance.getJSON());
      if (content.length === 0)
        return;
      void mutation.trigger(
        { content },
        {
          onSuccess: () => {
            instance.commands.clearContent();
          }
        }
      );
    },
    [mutation]
  );
  const onSubmit = (e) => {
    if (editor === null)
      return;
    submit(editor);
    e.preventDefault();
  };
  React.useEffect(() => {
    if (!editor)
      return;
    editor.setEditable(!mutation.isMutating);
  }, [editor, mutation.isMutating]);
  return /* @__PURE__ */ jsx(
    "form",
    {
      className: "fc-relative fc-flex fc-flex-col fc-rounded-xl fc-border fc-border-border fc-bg-card",
      onSubmit,
      children: editor ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(SendButton, { editor, loading: mutation.isMutating }),
        /* @__PURE__ */ jsx(EditorContent, { editor })
      ] }) : /* @__PURE__ */ jsx("div", { className: "fc-min-h-[40px] fc-text-sm fc-px-3 fc-py-1.5 fc-text-muted-foreground", children: "Leave comment" })
    }
  );
}
function SendButton({
  editor,
  loading
}) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      "aria-label": "Send Comment",
      className: cn(
        "fc-absolute fc-p-1.5 fc-right-2 fc-bottom-2 fc-bg-primary fc-text-primary-foreground fc-transition-colors fc-rounded-full fc-z-10 hover:fc-bg-primary/80",
        (loading || editor.isEmpty) && "fc-text-muted-foreground fc-bg-muted"
      ),
      disabled: loading,
      type: "submit",
      children: loading ? /* @__PURE__ */ jsx("div", { className: "fc-w-4 fc-h-4 fc-rounded-full fc-border-2 fc-border-border", children: /* @__PURE__ */ jsx("div", { className: "fc-w-full fc-h-full fc-rounded-full fc-border-l-2 fc-border-primary fc-animate-spin" }) }) : /* @__PURE__ */ jsxs(
        "svg",
        {
          className: "fc-w-4 fc-h-4",
          fill: "none",
          height: "24",
          stroke: "currentColor",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: "2",
          viewBox: "0 0 24 24",
          width: "24",
          children: [
            /* @__PURE__ */ jsx("path", { d: "m22 2-7 20-4-9-9-4Z" }),
            /* @__PURE__ */ jsx("path", { d: "M22 2 11 13" })
          ]
        }
      )
    }
  );
}
function flatten(content) {
  var _a, _b;
  const s = [(_a = content.text) != null ? _a : ""];
  for (const child of (_b = content.content) != null ? _b : []) {
    s.push(flatten(child));
    if (child.type === "paragraph")
      s.push("\n");
  }
  return s.join("").trim();
}

// src/utils/date.ts
function toLocalString(date) {
  const today = new Date(Date.now());
  const isToday = date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
  const day = isToday ? "Today" : [
    date.getDate().toString().padStart(2, "0"),
    date.getMonth().toString().padStart(2, "0"),
    date.getFullYear()
  ].join("/");
  const time = [
    date.getHours().toString().padStart(2, "0"),
    date.getMinutes().toString().padStart(2, "0")
  ].join(":");
  return `${day} ${time}`;
}

// src/components/menu.tsx
import { Menu as Base, Transition } from "@headlessui/react";
import { cva } from "cva";
import { Fragment as Fragment2, forwardRef } from "react";
import { jsx as jsx2 } from "react/jsx-runtime";
var menuItemVariants = cva(
  "fc-text-left fc-px-3 fc-py-1.5 fc-transition-colors disabled:fc-opacity-80 disabled:fc-cursor-not-allowed",
  {
    variants: {
      active: {
        true: "fc-bg-accent fc-text-accent-foreground",
        false: ""
      }
    }
  }
);
var menuItemsVariants = cva(
  "fc-absolute fc-flex fc-flex-col fc-right-0 fc-mt-4 fc-w-56 fc-origin-top-right fc-divide-y fc-divide-border fc-rounded-md fc-text-popover-foreground fc-bg-popover fc-shadow-lg fc-overflow-hidden fc-z-50 focus-visible:fc-ring-1 focus-visible:fc-ring-ring focus-visible:fc-outline-none"
);
var MenuItems = forwardRef(
  (_a, ref) => {
    var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
    return /* @__PURE__ */ jsx2(
      Transition,
      {
        as: Fragment2,
        enter: "transition fc-ease-out fc-duration-100",
        enterFrom: "transform fc-opacity-0 fc-scale-95",
        enterTo: "transform fc-opacity-100 fc-scale-100",
        leave: "transition fc-ease-in fc-duration-75",
        leaveFrom: "transform fc-opacity-100 fc-scale-100",
        leaveTo: "transform fc-opacity-0 fc-scale-95",
        children: /* @__PURE__ */ jsx2(
          Base.Items,
          __spreadProps(__spreadValues({
            className: cn(menuItemsVariants({ className })),
            ref
          }, props), {
            children: props.children
          })
        )
      }
    );
  }
);
MenuItems.displayName = Base.Items.displayName;
var MenuItem = forwardRef(
  (_a, ref) => {
    var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
    return /* @__PURE__ */ jsx2(Base.Item, { children: ({ active }) => /* @__PURE__ */ jsx2(
      "button",
      __spreadProps(__spreadValues({
        className: cn(menuItemVariants({ active, className })),
        ref,
        type: "button"
      }, props), {
        children: props.children
      })
    ) });
  }
);
MenuItem.displayName = Base.Item.displayName;
var MenuTrigger = Base.Button;

// src/comments.tsx
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
function Comments() {
  var _a;
  const query = useSWR("/api/comments", (key) => fetcher(key));
  return /* @__PURE__ */ jsxs2("div", { className: "fc-bg-background fc-text-foreground fc-p-4 fc-rounded-xl fc-border fc-border-border", children: [
    /* @__PURE__ */ jsx3("p", { className: "fc-font-bold fc-mb-4", children: "Comments" }),
    /* @__PURE__ */ jsx3(CommentEditor, {}),
    /* @__PURE__ */ jsx3("div", { className: "fc-flex fc-flex-col fc-gap-2 fc-mt-4 fc-border-t fc-border-border fc-pt-4", children: (_a = query.data) == null ? void 0 : _a.map((comment) => /* @__PURE__ */ jsx3(CommentCard, __spreadValues({}, comment), comment.id)) })
  ] });
}
function CommentCard(props) {
  const [timestamp, setTimestamp] = useState("");
  const deleteMutation = useSWRMutation(
    "/api/comments",
    (key) => fetcher(`${key}/${props.id}`, { method: "DELETE" })
  );
  const onDelete = () => {
    void deleteMutation.trigger();
  };
  useEffect2(() => {
    const parsed = new Date(props.timestamp);
    setTimestamp(toLocalString(parsed));
  }, [props.timestamp]);
  return /* @__PURE__ */ jsxs2("div", { className: "fc-group fc-relative fc-flex fc-flex-row fc-gap-2 fc-rounded-xl fc-text-sm fc-p-3 -fc-mx-3 hover:fc-bg-card", children: [
    /* @__PURE__ */ jsx3("div", { className: "fc-flex fc-items-center fc-justify-center fc-w-7 fc-h-7 fc-rounded-full fc-bg-gradient-to-br fc-from-blue-600 fc-to-red-600", children: "F" }),
    /* @__PURE__ */ jsxs2("div", { className: "fc-flex-1", children: [
      /* @__PURE__ */ jsxs2("p", { className: "fc-inline-flex fc-gap-2 fc-items-center fc-mb-2", children: [
        /* @__PURE__ */ jsx3("span", { className: "fc-font-semibold", children: props.author }),
        /* @__PURE__ */ jsx3("span", { className: "fc-text-muted-foreground fc-text-xs", children: timestamp })
      ] }),
      /* @__PURE__ */ jsx3("p", { children: props.content })
    ] }),
    /* @__PURE__ */ jsxs2(Menu, { children: [
      /* @__PURE__ */ jsx3(MenuTrigger, { className: "fc-inline-flex fc-items-center fc-justify-center fc-w-6 fc-h-6 fc-rounded-full fc-opacity-0 group-hover:fc-opacity-100 data-[headlessui-state=open]:fc-bg-accent data-[headlessui-state=open]:fc-opacity-100", children: /* @__PURE__ */ jsxs2(
        "svg",
        {
          className: "fc-w-4 fc-h-4",
          fill: "none",
          height: "24",
          stroke: "currentColor",
          strokeWidth: "2",
          viewBox: "0 0 24 24",
          width: "24",
          children: [
            /* @__PURE__ */ jsx3("circle", { cx: "12", cy: "12", r: "1" }),
            /* @__PURE__ */ jsx3("circle", { cx: "12", cy: "5", r: "1" }),
            /* @__PURE__ */ jsx3("circle", { cx: "12", cy: "19", r: "1" })
          ]
        }
      ) }),
      /* @__PURE__ */ jsxs2(MenuItems, { children: [
        /* @__PURE__ */ jsx3(MenuItem, { children: "Edit" }),
        /* @__PURE__ */ jsx3(
          MenuItem,
          {
            disabled: deleteMutation.isMutating,
            onClick: onDelete,
            type: "button",
            children: "Delete"
          }
        )
      ] })
    ] })
  ] });
}
export {
  Comments
};
