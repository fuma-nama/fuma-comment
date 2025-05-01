"use client";
import {
  CommentsList,
  CommentsPost,
  CommentsProvider
} from "./chunk-UJMLHDHU.js";
import "./chunk-P3GC32AD.js";
import "./chunk-B5523HTG.js";
import "./chunk-SIPNGVYW.js";
import "./chunk-35YJQ6GS.js";
import {
  twMerge
} from "./chunk-5NN7OVAV.js";
import {
  __objRest,
  __spreadProps,
  __spreadValues
} from "./chunk-BBZEL7EG.js";

// src/comments.tsx
import { forwardRef } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
var Comments = forwardRef(
  (_a, ref) => {
    var _b = _a, { page, className, title, storage, mention, auth, apiUrl } = _b, props = __objRest(_b, ["page", "className", "title", "storage", "mention", "auth", "apiUrl"]);
    return /* @__PURE__ */ jsx(
      CommentsProvider,
      {
        page,
        apiUrl,
        auth,
        storage,
        mention,
        children: /* @__PURE__ */ jsxs(
          "div",
          __spreadProps(__spreadValues({
            className: twMerge(
              "overflow-hidden rounded-xl border border-fc-border bg-fc-background text-fc-foreground",
              className
            ),
            ref
          }, props), {
            children: [
              /* @__PURE__ */ jsx(Inner, { title }),
              /* @__PURE__ */ jsx(CommentsList, {})
            ]
          })
        )
      }
    );
  }
);
function Inner(props) {
  return /* @__PURE__ */ jsxs("div", { className: "relative flex flex-col gap-2", children: [
    props.title,
    /* @__PURE__ */ jsx(CommentsPost, {})
  ] });
}
Comments.displayName = "Comments";
export {
  Comments
};
