import {
  __async,
  __objRest,
  __spreadProps,
  __spreadValues
} from "./chunk-BBZEL7EG.js";

// src/contexts/comments.tsx
import { createContext, useContext } from "react";
var CommentsContext = createContext(null);
function useCommentsContext() {
  const context = useContext(CommentsContext);
  if (!context) {
    throw new Error(
      "useCommentsContext must be used within a CommentsProvider"
    );
  }
  return context;
}
var CommentsProvider = CommentsContext.Provider;

// src/utils/cn.ts
import { twMerge } from "tailwind-merge";

// ../../node_modules/.pnpm/lucide-react@0.503.0_react@19.1.0/node_modules/lucide-react/dist/esm/createLucideIcon.js
import { forwardRef as forwardRef2, createElement as createElement2 } from "react";

// ../../node_modules/.pnpm/lucide-react@0.503.0_react@19.1.0/node_modules/lucide-react/dist/esm/shared/src/utils.js
var toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
var toCamelCase = (string) => string.replace(
  /^([A-Z])|[\s-_]+(\w)/g,
  (match, p1, p2) => p2 ? p2.toUpperCase() : p1.toLowerCase()
);
var toPascalCase = (string) => {
  const camelCase = toCamelCase(string);
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
};
var mergeClasses = (...classes) => classes.filter((className, index, array) => {
  return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
}).join(" ").trim();
var hasA11yProp = (props) => {
  for (const prop in props) {
    if (prop.startsWith("aria-") || prop === "role" || prop === "title") {
      return true;
    }
  }
};

// ../../node_modules/.pnpm/lucide-react@0.503.0_react@19.1.0/node_modules/lucide-react/dist/esm/Icon.js
import { forwardRef, createElement } from "react";

// ../../node_modules/.pnpm/lucide-react@0.503.0_react@19.1.0/node_modules/lucide-react/dist/esm/defaultAttributes.js
var defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};

// ../../node_modules/.pnpm/lucide-react@0.503.0_react@19.1.0/node_modules/lucide-react/dist/esm/Icon.js
var Icon = forwardRef(
  (_a, ref) => {
    var _b = _a, {
      color = "currentColor",
      size = 24,
      strokeWidth = 2,
      absoluteStrokeWidth,
      className = "",
      children,
      iconNode
    } = _b, rest = __objRest(_b, [
      "color",
      "size",
      "strokeWidth",
      "absoluteStrokeWidth",
      "className",
      "children",
      "iconNode"
    ]);
    return createElement(
      "svg",
      __spreadValues(__spreadValues(__spreadProps(__spreadValues({
        ref
      }, defaultAttributes), {
        width: size,
        height: size,
        stroke: color,
        strokeWidth: absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
        className: mergeClasses("lucide", className)
      }), !children && !hasA11yProp(rest) && { "aria-hidden": "true" }), rest),
      [
        ...iconNode.map(([tag, attrs]) => createElement(tag, attrs)),
        ...Array.isArray(children) ? children : [children]
      ]
    );
  }
);

// ../../node_modules/.pnpm/lucide-react@0.503.0_react@19.1.0/node_modules/lucide-react/dist/esm/createLucideIcon.js
var createLucideIcon = (iconName, iconNode) => {
  const Component = forwardRef2(
    (_a, ref) => {
      var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
      return createElement2(Icon, __spreadValues({
        ref,
        iconNode,
        className: mergeClasses(
          `lucide-${toKebabCase(toPascalCase(iconName))}`,
          `lucide-${iconName}`,
          className
        )
      }, props));
    }
  );
  Component.displayName = toPascalCase(iconName);
  return Component;
};

// ../../node_modules/.pnpm/lucide-react@0.503.0_react@19.1.0/node_modules/lucide-react/dist/esm/icons/image.js
var __iconNode = [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2", key: "1m3agn" }],
  ["circle", { cx: "9", cy: "9", r: "2", key: "af1f0g" }],
  ["path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21", key: "1xmnt7" }]
];
var Image = createLucideIcon("image", __iconNode);

// ../../node_modules/.pnpm/lucide-react@0.503.0_react@19.1.0/node_modules/lucide-react/dist/esm/icons/smile.js
var __iconNode2 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M8 14s1.5 2 4 2 4-2 4-2", key: "1y1vjs" }],
  ["line", { x1: "9", x2: "9.01", y1: "9", y2: "9", key: "yxxnd0" }],
  ["line", { x1: "15", x2: "15.01", y1: "9", y2: "9", key: "1p4y9e" }]
];
var Smile = createLucideIcon("smile", __iconNode2);

// ../../node_modules/.pnpm/lucide-react@0.503.0_react@19.1.0/node_modules/lucide-react/dist/esm/icons/square-code.js
var __iconNode3 = [
  ["path", { d: "M10 9.5 8 12l2 2.5", key: "3mjy60" }],
  ["path", { d: "m14 9.5 2 2.5-2 2.5", key: "1bir2l" }],
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" }]
];
var SquareCode = createLucideIcon("square-code", __iconNode3);

// ../../node_modules/.pnpm/lucide-react@0.503.0_react@19.1.0/node_modules/lucide-react/dist/esm/icons/bold.js
var __iconNode4 = [
  [
    "path",
    { d: "M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8", key: "mg9rjx" }
  ]
];
var Bold = createLucideIcon("bold", __iconNode4);

// ../../node_modules/.pnpm/lucide-react@0.503.0_react@19.1.0/node_modules/lucide-react/dist/esm/icons/check.js
var __iconNode5 = [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]];
var Check = createLucideIcon("check", __iconNode5);

// ../../node_modules/.pnpm/lucide-react@0.503.0_react@19.1.0/node_modules/lucide-react/dist/esm/icons/chevron-down.js
var __iconNode6 = [["path", { d: "m6 9 6 6 6-6", key: "qrunsl" }]];
var ChevronDown = createLucideIcon("chevron-down", __iconNode6);

// ../../node_modules/.pnpm/lucide-react@0.503.0_react@19.1.0/node_modules/lucide-react/dist/esm/icons/code.js
var __iconNode7 = [
  ["polyline", { points: "16 18 22 12 16 6", key: "z7tu5w" }],
  ["polyline", { points: "8 6 2 12 8 18", key: "1eg1df" }]
];
var Code = createLucideIcon("code", __iconNode7);

// ../../node_modules/.pnpm/lucide-react@0.503.0_react@19.1.0/node_modules/lucide-react/dist/esm/icons/copy.js
var __iconNode8 = [
  ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2", key: "17jyea" }],
  ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2", key: "zix9uf" }]
];
var Copy = createLucideIcon("copy", __iconNode8);

// ../../node_modules/.pnpm/lucide-react@0.503.0_react@19.1.0/node_modules/lucide-react/dist/esm/icons/ellipsis-vertical.js
var __iconNode9 = [
  ["circle", { cx: "12", cy: "12", r: "1", key: "41hilf" }],
  ["circle", { cx: "12", cy: "5", r: "1", key: "gxeob9" }],
  ["circle", { cx: "12", cy: "19", r: "1", key: "lyex9k" }]
];
var EllipsisVertical = createLucideIcon("ellipsis-vertical", __iconNode9);

// ../../node_modules/.pnpm/lucide-react@0.503.0_react@19.1.0/node_modules/lucide-react/dist/esm/icons/italic.js
var __iconNode10 = [
  ["line", { x1: "19", x2: "10", y1: "4", y2: "4", key: "15jd3p" }],
  ["line", { x1: "14", x2: "5", y1: "20", y2: "20", key: "bu0au3" }],
  ["line", { x1: "15", x2: "9", y1: "4", y2: "20", key: "uljnxc" }]
];
var Italic = createLucideIcon("italic", __iconNode10);

// ../../node_modules/.pnpm/lucide-react@0.503.0_react@19.1.0/node_modules/lucide-react/dist/esm/icons/link.js
var __iconNode11 = [
  ["path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71", key: "1cjeqo" }],
  ["path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71", key: "19qd67" }]
];
var Link = createLucideIcon("link", __iconNode11);

// ../../node_modules/.pnpm/lucide-react@0.503.0_react@19.1.0/node_modules/lucide-react/dist/esm/icons/loader-circle.js
var __iconNode12 = [["path", { d: "M21 12a9 9 0 1 1-6.219-8.56", key: "13zald" }]];
var LoaderCircle = createLucideIcon("loader-circle", __iconNode12);

// ../../node_modules/.pnpm/lucide-react@0.503.0_react@19.1.0/node_modules/lucide-react/dist/esm/icons/pencil.js
var __iconNode13 = [
  [
    "path",
    {
      d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
      key: "1a8usu"
    }
  ],
  ["path", { d: "m15 5 4 4", key: "1mk7zo" }]
];
var Pencil = createLucideIcon("pencil", __iconNode13);

// ../../node_modules/.pnpm/lucide-react@0.503.0_react@19.1.0/node_modules/lucide-react/dist/esm/icons/reply.js
var __iconNode14 = [
  ["polyline", { points: "9 17 4 12 9 7", key: "hvgpf2" }],
  ["path", { d: "M20 18v-2a4 4 0 0 0-4-4H4", key: "5vmcpk" }]
];
var Reply = createLucideIcon("reply", __iconNode14);

// ../../node_modules/.pnpm/lucide-react@0.503.0_react@19.1.0/node_modules/lucide-react/dist/esm/icons/send-horizontal.js
var __iconNode15 = [
  [
    "path",
    {
      d: "M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z",
      key: "117uat"
    }
  ],
  ["path", { d: "M6 12h16", key: "s4cdu5" }]
];
var SendHorizontal = createLucideIcon("send-horizontal", __iconNode15);

// ../../node_modules/.pnpm/lucide-react@0.503.0_react@19.1.0/node_modules/lucide-react/dist/esm/icons/strikethrough.js
var __iconNode16 = [
  ["path", { d: "M16 4H9a3 3 0 0 0-2.83 4", key: "43sutm" }],
  ["path", { d: "M14 12a4 4 0 0 1 0 8H6", key: "nlfj13" }],
  ["line", { x1: "4", x2: "20", y1: "12", y2: "12", key: "1e0a9i" }]
];
var Strikethrough = createLucideIcon("strikethrough", __iconNode16);

// ../../node_modules/.pnpm/lucide-react@0.503.0_react@19.1.0/node_modules/lucide-react/dist/esm/icons/thumbs-down.js
var __iconNode17 = [
  ["path", { d: "M17 14V2", key: "8ymqnk" }],
  [
    "path",
    {
      d: "M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z",
      key: "m61m77"
    }
  ]
];
var ThumbsDown = createLucideIcon("thumbs-down", __iconNode17);

// ../../node_modules/.pnpm/lucide-react@0.503.0_react@19.1.0/node_modules/lucide-react/dist/esm/icons/thumbs-up.js
var __iconNode18 = [
  ["path", { d: "M7 10v12", key: "1qc93n" }],
  [
    "path",
    {
      d: "M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z",
      key: "emmmcr"
    }
  ]
];
var ThumbsUp = createLucideIcon("thumbs-up", __iconNode18);

// ../../node_modules/.pnpm/lucide-react@0.503.0_react@19.1.0/node_modules/lucide-react/dist/esm/icons/trash-2.js
var __iconNode19 = [
  ["path", { d: "M3 6h18", key: "d0wm0j" }],
  ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", key: "4alrt4" }],
  ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", key: "v07s0e" }],
  ["line", { x1: "10", x2: "10", y1: "11", y2: "17", key: "1uufr5" }],
  ["line", { x1: "14", x2: "14", y1: "11", y2: "17", key: "xtxkd" }]
];
var Trash2 = createLucideIcon("trash-2", __iconNode19);

// ../../node_modules/.pnpm/lucide-react@0.503.0_react@19.1.0/node_modules/lucide-react/dist/esm/icons/x.js
var __iconNode20 = [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
];
var X = createLucideIcon("x", __iconNode20);

// src/utils/hooks.ts
import { useCallback, useEffect, useRef, useState } from "react";
function useLatestCallback(latest) {
  const ref = useRef(latest);
  ref.current = latest;
  return useCallback((...args) => ref.current(...args), []);
}
function useObjectURL(value) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    const created = value ? URL.createObjectURL(value) : null;
    setUrl(created);
    return () => {
      if (created) URL.revokeObjectURL(created);
    };
  }, [value]);
  return url;
}

// src/components/button.tsx
import { cva } from "class-variance-authority";
var buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium cursor-pointer disabled:pointer-events-none disabled:bg-fc-muted disabled:text-fc-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fc-ring",
  {
    variants: {
      size: {
        small: "h-8 px-2 text-xs",
        medium: "px-3 py-2 text-sm",
        default: "h-8 min-w-20 text-sm",
        icon: "size-7 rounded-full"
      },
      variant: {
        primary: "bg-fc-primary text-fc-primary-foreground transition-colors hover:bg-fc-primary/80",
        secondary: "border border-fc-border bg-fc-card transition-colors hover:bg-fc-accent",
        ghost: "transition-colors hover:bg-fc-accent/80"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default"
    }
  }
);

// src/contexts/storage.tsx
import { createContext as createContext2, useContext as useContext2 } from "react";
import { jsx } from "react/jsx-runtime";
var StorageContext = createContext2({
  enabled: false,
  upload: () => {
    throw new Error("Not implemented");
  }
});
function useStorage() {
  return useContext2(StorageContext);
}
function StorageProvider({
  storage,
  children
}) {
  return /* @__PURE__ */ jsx(StorageContext.Provider, { value: storage, children });
}

// src/contexts/mention.tsx
import { createContext as createContext3, useContext as useContext3, useMemo } from "react";
import { jsx as jsx2 } from "react/jsx-runtime";
var MentionContext = createContext3({
  enabled: false,
  query: () => []
});
function MentionProvider({
  mention,
  children
}) {
  const { fetcher } = useCommentsContext();
  const query = useLatestCallback(
    (name, options) => __async(null, null, function* () {
      if (mention.query) void mention.query(name, options);
      const res = yield fetcher.queryUsers({ name, page: options.page });
      return res.map((user) => ({ label: user.name, id: user.id }));
    })
  );
  const value = useMemo(
    () => ({
      enabled: mention.enabled,
      query
    }),
    [mention.enabled, query]
  );
  return /* @__PURE__ */ jsx2(MentionContext.Provider, { value, children });
}
function useMention() {
  return useContext3(MentionContext);
}

export {
  useCommentsContext,
  CommentsProvider,
  twMerge,
  Bold,
  Check,
  ChevronDown,
  Code,
  Copy,
  EllipsisVertical,
  Image,
  Italic,
  Link,
  LoaderCircle,
  Pencil,
  Reply,
  SendHorizontal,
  Smile,
  SquareCode,
  Strikethrough,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
  useLatestCallback,
  useObjectURL,
  buttonVariants,
  useStorage,
  StorageProvider,
  MentionProvider,
  useMention
};
/*! Bundled license information:

lucide-react/dist/esm/shared/src/utils.js:
lucide-react/dist/esm/defaultAttributes.js:
lucide-react/dist/esm/Icon.js:
lucide-react/dist/esm/createLucideIcon.js:
lucide-react/dist/esm/icons/image.js:
lucide-react/dist/esm/icons/smile.js:
lucide-react/dist/esm/icons/square-code.js:
lucide-react/dist/esm/icons/bold.js:
lucide-react/dist/esm/icons/check.js:
lucide-react/dist/esm/icons/chevron-down.js:
lucide-react/dist/esm/icons/code.js:
lucide-react/dist/esm/icons/copy.js:
lucide-react/dist/esm/icons/ellipsis-vertical.js:
lucide-react/dist/esm/icons/italic.js:
lucide-react/dist/esm/icons/link.js:
lucide-react/dist/esm/icons/loader-circle.js:
lucide-react/dist/esm/icons/pencil.js:
lucide-react/dist/esm/icons/reply.js:
lucide-react/dist/esm/icons/send-horizontal.js:
lucide-react/dist/esm/icons/strikethrough.js:
lucide-react/dist/esm/icons/thumbs-down.js:
lucide-react/dist/esm/icons/thumbs-up.js:
lucide-react/dist/esm/icons/trash-2.js:
lucide-react/dist/esm/icons/x.js:
lucide-react/dist/esm/lucide-react.js:
  (**
   * @license lucide-react v0.503.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
