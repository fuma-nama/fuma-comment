import {
  lowlight
} from "./chunk-B5523HTG.js";
import {
  Check,
  Copy,
  buttonVariants,
  twMerge,
  useStorage
} from "./chunk-5NN7OVAV.js";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-BBZEL7EG.js";

// src/components/comment/content-renderer.tsx
import { useMemo, useState } from "react";
import { cva } from "class-variance-authority";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var mentionVariants = cva(
  "rounded-md bg-fc-primary/10 p-0.5 font-medium text-fc-primary"
);
var codeVariants = cva(
  "rounded-sm border border-fc-border bg-fc-muted p-0.5"
);
var codeBlockVariants = cva(
  "relative grid rounded-sm border border-fc-border bg-fc-muted p-2 text-sm my-1.5"
);
var defaultRenderer = (props) => /* @__PURE__ */ jsx2("span", __spreadValues({}, props));
var marks = {
  bold: {
    className: "font-bold"
  },
  strike: {
    className: "line-through"
  },
  italic: {
    className: "italic"
  },
  code: {
    className: codeVariants(),
    element: () => (props) => /* @__PURE__ */ jsx2("code", __spreadValues({}, props))
  },
  mention: {
    className: mentionVariants()
  },
  link: {
    className: "font-medium underline",
    element(mark) {
      var _a;
      const href = (_a = mark.attrs) == null ? void 0 : _a.href;
      if (typeof href === "string")
        return function Link(props) {
          return /* @__PURE__ */ jsx2("a", __spreadProps(__spreadValues({ href, rel: "noreferrer noopener" }, props), { children: props.children }));
        };
      return defaultRenderer;
    }
  }
};
var id = 0;
function renderText(content) {
  var _a;
  let Element = defaultRenderer;
  const className = [];
  for (const mark of (_a = content.marks) != null ? _a : []) {
    if (mark.type in marks) {
      const m = marks[mark.type];
      if (m.className) className.push(m.className);
      if (m.element) Element = m.element(mark);
    }
  }
  return /* @__PURE__ */ jsx2(Element, { className: twMerge(className), children: content.text }, id++);
}
function render(content, storage) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  if (content.type === "text") {
    return renderText(content);
  }
  if (content.type === "codeBlock") {
    return /* @__PURE__ */ jsx2(
      CodeBlock,
      {
        language: (_a = content.attrs) == null ? void 0 : _a.language,
        content: (_d = (_c = (_b = content.content) == null ? void 0 : _b[0]) == null ? void 0 : _c.text) != null ? _d : ""
      },
      id++
    );
  }
  if (content.type === "image" && typeof ((_e = content.attrs) == null ? void 0 : _e.src) === "string") {
    const attrs = content.attrs;
    if (typeof storage.render === "function") {
      return storage.render(__spreadProps(__spreadValues({}, attrs), {
        alt: (_f = attrs.alt) != null ? _f : "uploaded image"
      }));
    }
    const maxWidth = 600;
    const maxHeight = 400;
    let w = attrs.width;
    let h = attrs.height;
    if (w > maxWidth) {
      h = maxWidth * h / w;
      w = maxWidth;
    }
    if (h > maxHeight) {
      w = maxHeight * w / h;
      h = maxHeight;
    }
    return /* @__PURE__ */ jsx2(
      "img",
      {
        alt: attrs.alt,
        className: "rounded-lg my-1.5",
        height: h,
        width: w,
        src: content.attrs.src
      },
      id++
    );
  }
  if (content.type === "mention") {
    const attrs = content.attrs;
    return /* @__PURE__ */ jsxs2("span", { className: twMerge(mentionVariants()), children: [
      "@",
      (_g = attrs.label) != null ? _g : attrs.id
    ] }, id++);
  }
  const joined = (_i = (_h = content.content) == null ? void 0 : _h.map(
    (child) => render(child, storage)
  )) != null ? _i : [" "];
  if (content.type === "paragraph") {
    return /* @__PURE__ */ jsx2("span", { children: joined }, id++);
  }
  if (content.type === "doc") {
    return /* @__PURE__ */ jsx2("div", { className: "grid whitespace-pre-wrap break-words", children: joined }, id++);
  }
}
function ContentRenderer({
  content
}) {
  const ctx = useStorage();
  return useMemo(() => render(content, ctx), [content, ctx]);
}
function CodeBlock({
  language,
  content
}) {
  const tree = lowlight.highlight(
    lowlight.registered(language) ? language : "plaintext",
    content
  );
  const [copied, setCopied] = useState(false);
  return /* @__PURE__ */ jsxs2("pre", { className: twMerge(codeBlockVariants(), "p-0"), children: [
    /* @__PURE__ */ jsx2("code", { className: "overflow-auto p-2", children: toJsxRuntime(tree, { Fragment, jsx, jsxs }) }),
    /* @__PURE__ */ jsx2(
      "button",
      {
        type: "button",
        className: twMerge(
          buttonVariants({
            size: "icon",
            variant: "secondary"
          }),
          "absolute right-0.5 top-0.5"
        ),
        onClick: () => {
          navigator.clipboard.writeText(content);
          setCopied(true);
          setTimeout(() => setCopied(false), 1e3);
        },
        children: copied ? /* @__PURE__ */ jsx2(Check, { className: "size-3.5" }) : /* @__PURE__ */ jsx2(Copy, { className: "size-3.5" })
      }
    )
  ] });
}

export {
  mentionVariants,
  codeVariants,
  codeBlockVariants,
  ContentRenderer
};
