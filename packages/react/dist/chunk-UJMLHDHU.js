import {
  ContentRenderer
} from "./chunk-P3GC32AD.js";
import {
  Spinner
} from "./chunk-SIPNGVYW.js";
import {
  CommentEditor,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  clearPersistentId,
  useIsMobile
} from "./chunk-35YJQ6GS.js";
import {
  ChevronDown,
  CommentsProvider,
  Copy,
  EllipsisVertical,
  MentionProvider,
  Pencil,
  Reply,
  SendHorizontal,
  StorageProvider,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  buttonVariants,
  twMerge,
  useCommentsContext,
  useLatestCallback
} from "./chunk-5NN7OVAV.js";
import {
  __async,
  __objRest,
  __spreadProps,
  __spreadValues
} from "./chunk-BBZEL7EG.js";

// src/atom.tsx
import {
  useMemo as useMemo3,
  forwardRef as forwardRef3
} from "react";

// src/contexts/auth.tsx
import { createContext, useContext, useMemo } from "react";
import useSWRImmutable from "swr/immutable";
import { jsx } from "react/jsx-runtime";
var AuthContext = createContext(void 0);
function useAuthContext() {
  const auth = useContext(AuthContext);
  if (!auth)
    throw new Error("Components must be wrapped under <CommentsProvider />");
  return auth;
}
function AuthProvider({
  page,
  auth,
  children
}) {
  const { fetcher } = useCommentsContext();
  const query = useSWRImmutable(
    auth.type === "api" ? `/api/comment/${page}/auth` : null,
    () => fetcher.getAuthSession({ page }),
    {
      shouldRetryOnError: false
    }
  );
  const value = useMemo(() => {
    var _a;
    if (auth.type === "ssr")
      return {
        isLoading: false,
        session: auth.session,
        signIn: auth.signIn
      };
    return {
      session: query.data ? {
        id: query.data.id,
        permissions: {
          delete: ((_a = query.data.role) == null ? void 0 : _a.canDelete) === true
        }
      } : null,
      isLoading: query.isLoading,
      signIn: auth.signIn
    };
  }, [auth, query.data, query.isLoading]);
  return /* @__PURE__ */ jsx(AuthContext.Provider, { value, children });
}

// src/components/comment/create-form.tsx
import useSWRMutation from "swr/mutation";
import {
  forwardRef,
  useCallback,
  useRef,
  useState as useState3
} from "react";

// src/utils/fetcher.ts
function createFetcher(apiUrl = "/api/comments") {
  function fetcher(url, init) {
    return __async(this, null, function* () {
      const response = yield fetch(url, init);
      if (!response.ok) {
        const message = yield response.text();
        let err = new Error(message);
        try {
          const obj = JSON.parse(message);
          if ("message" in obj && typeof obj.message === "string") {
            err = new Error(obj.message);
          }
        } catch (e) {
        }
        throw err;
      }
      return yield response.json();
    });
  }
  function fetchComments({
    page,
    thread,
    sort,
    before,
    after,
    limit
  }) {
    const params = new URLSearchParams();
    if (thread) params.append("thread", thread.toString());
    if (sort) params.append("sort", sort);
    if (before) params.append("before", before.getTime().toString());
    if (limit) params.append("limit", limit.toString());
    if (after) params.append("after", after.getTime().toString());
    return fetcher(`${apiUrl}/${page}/?${params.toString()}`);
  }
  function postComment(_0) {
    return __async(this, arguments, function* ({
      content,
      page,
      thread
    }) {
      return yield fetcher(`${apiUrl}/${page}`, {
        method: "POST",
        body: JSON.stringify({
          thread,
          content
        })
      });
    });
  }
  function editComment(_0) {
    return __async(this, arguments, function* ({
      id,
      page,
      content
    }) {
      yield fetcher(`${apiUrl}/${page}/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          content
        })
      });
    });
  }
  function deleteComment(options) {
    return __async(this, null, function* () {
      yield fetcher(`${apiUrl}/${options.page}/${options.id}`, {
        method: "DELETE"
      });
    });
  }
  function setRate(options) {
    return __async(this, null, function* () {
      yield fetcher(`${apiUrl}/${options.page}/${options.id}/rate`, {
        method: "POST",
        body: JSON.stringify({ like: options.like })
      });
    });
  }
  function queryUsers(options) {
    return __async(this, null, function* () {
      const params = new URLSearchParams();
      params.append("name", options.name);
      return fetcher(`${apiUrl}/${options.page}/users?${params.toString()}`);
    });
  }
  function deleteRate(options) {
    return __async(this, null, function* () {
      yield fetcher(`${apiUrl}/${options.page}/${options.id}/rate`, {
        method: "DELETE"
      });
    });
  }
  function getAuthSession(options) {
    return __async(this, null, function* () {
      return yield fetcher(`${apiUrl}/${options.page}/auth`, {
        method: "GET"
      });
    });
  }
  return {
    fetchComments,
    postComment,
    editComment,
    deleteComment,
    setRate,
    queryUsers,
    deleteRate,
    getAuthSession
  };
}
function getCommentsKey(options) {
  return ["/api/comments", options];
}

// src/utils/comment-list.ts
import { useState } from "react";

// src/utils/use-listener.ts
import { useEffect } from "react";
function createListener() {
  const listeners = /* @__PURE__ */ new Map();
  return {
    trigger(id, ...args) {
      var _a;
      for (const listener of (_a = listeners.get(id)) != null ? _a : []) {
        listener(...args);
      }
    },
    useListener(id, listener) {
      useEffect(() => {
        var _a;
        const list = (_a = listeners.get(id)) != null ? _a : [];
        list.push(listener);
        listeners.set(id, list);
        return () => {
          var _a2, _b;
          listeners.set(
            id,
            (_b = (_a2 = listeners.get(id)) == null ? void 0 : _a2.filter((item) => item !== listener)) != null ? _b : []
          );
        };
      }, [id, listener, listeners]);
    }
  };
}

// src/utils/comment-list.ts
var data = /* @__PURE__ */ new Map();
var { useListener, trigger } = createListener();
function useCommentList(id) {
  const key = getKey(id);
  const [list, setList] = useState(() => {
    var _a;
    return (_a = data.get(key)) != null ? _a : [];
  });
  useListener(
    key,
    useLatestCallback(() => {
      var _a;
      setList((_a = data.get(key)) != null ? _a : []);
    })
  );
  return list;
}
function updateCommentList(id, update) {
  const key = getKey(id);
  const list = data.get(key);
  const updated = update(list);
  if (updated) {
    data.set(key, updated);
    trigger(key);
  }
}
function getKey(id) {
  var _a;
  return `${id[0]}:${(_a = id[1]) != null ? _a : "unset"}`;
}

// src/utils/comment-manager.ts
import { useState as useState2 } from "react";
var map = /* @__PURE__ */ new Map();
var { useListener: useListener2, trigger: trigger2 } = createListener();
function useCommentManager(id) {
  const [value, setValue] = useState2(() => map.get(id));
  useListener2(id, setValue);
  return value;
}
function syncComments(comments) {
  for (const comment of comments) {
    setComment(comment.id, comment);
  }
}
function setComment(id, c) {
  map.set(id, c);
  trigger2(id, c);
}
function updateComment(commentId, updateFn) {
  const comment = map.get(commentId);
  if (!comment) return;
  setComment(commentId, updateFn(comment));
}
function onCommentReplied(reply) {
  updateCommentList(
    [reply.page, reply.threadId],
    (v) => v ? [...v, reply] : void 0
  );
  if (reply.threadId) {
    updateComment(reply.threadId, (c) => {
      return __spreadProps(__spreadValues({}, c), { replies: c.replies + 1 });
    });
  }
}
function onCommentDeleted(comment) {
  updateCommentList(
    [comment.page, comment.threadId],
    (v) => v == null ? void 0 : v.filter((item) => item.id !== comment.id)
  );
  if (comment.threadId) {
    updateComment(comment.threadId, (c) => __spreadProps(__spreadValues({}, c), {
      replies: c.replies - 1
    }));
  }
}
function onLikeUpdated(commentId, value) {
  updateComment(commentId, (comment) => {
    let likes = comment.likes;
    let dislikes = comment.dislikes;
    if (comment.liked === true) likes--;
    if (comment.liked === false) dislikes--;
    if (value === true) likes++;
    if (value === false) dislikes++;
    return __spreadProps(__spreadValues({}, comment), {
      likes,
      dislikes,
      liked: value
    });
  });
}

// src/components/comment/create-form.tsx
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
var CreateForm = forwardRef((props, ref) => {
  const auth = useAuthContext();
  const { page, fetcher } = useCommentsContext();
  const [isEmpty, setIsEmpty] = useState3(true);
  const editorRef = useRef(void 0);
  const mutation = useSWRMutation(
    getCommentsKey({
      page
    }),
    (_, { arg }) => fetcher.postComment(__spreadValues({
      page
    }, arg)),
    {
      onSuccess: (data2) => {
        var _a;
        updateCommentList(
          [data2.page, data2.threadId],
          (v) => v ? [data2, ...v] : void 0
        );
        syncComments([data2]);
        (_a = editorRef.current) == null ? void 0 : _a.commands.clearContent(true);
      },
      revalidate: false
    }
  );
  const disabled = mutation.isMutating;
  const submit = useLatestCallback(() => {
    if (auth.isLoading || auth.session === null || !editorRef.current) return;
    const content = editorRef.current.getJSON();
    if (content.length === 0) return;
    clearPersistentId("create");
    void mutation.trigger({ content });
  });
  return /* @__PURE__ */ jsxs(
    "form",
    __spreadProps(__spreadValues({
      ref,
      onSubmit: (e) => {
        submit();
        e.preventDefault();
      }
    }, props), {
      className: twMerge("relative", props.className),
      children: [
        mutation.error ? /* @__PURE__ */ jsx2("p", { className: "text-sm text-fc-danger p-4", children: mutation.error.message }) : null,
        /* @__PURE__ */ jsx2(
          CommentEditor,
          {
            persistentId: "create",
            containerProps: {
              className: "border-none p-1 rounded-b-none focus-within:ring-0"
            },
            editorRef,
            disabled,
            onChange: useCallback((v) => {
              setIsEmpty(v.isEmpty);
            }, []),
            onSubmit: submit,
            placeholder: "\u8ACB\u8F38\u5165\u7559\u8A00..."
          }
        ),
        auth.isLoading || auth.session ? /* @__PURE__ */ jsx2(
          "button",
          {
            "aria-label": "Send",
            className: twMerge(
              buttonVariants({
                className: "absolute right-3.5 bottom-3",
                size: "icon"
              })
            ),
            disabled: disabled || isEmpty,
            type: "submit",
            children: mutation.isMutating ? /* @__PURE__ */ jsx2(Spinner, {}) : /* @__PURE__ */ jsx2(SendHorizontal, { className: "size-4" })
          }
        ) : /* @__PURE__ */ jsx2(
          AuthButton,
          {
            className: twMerge(
              buttonVariants({
                size: "small",
                className: "absolute right-3.5 bottom-3"
              })
            )
          }
        )
      ]
    })
  );
});
CreateForm.displayName = "CreateForm";

// src/components/comment/list.tsx
import { useRef as useRef4, useState as useState8 } from "react";
import useSWRImmutable2 from "swr/immutable";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@radix-ui/react-collapsible";

// src/contexts/comment.tsx
import { createContext as createContext2, useContext as useContext2 } from "react";
var CommentContext = createContext2(void 0);
function useCommentContext() {
  const ctx = useContext2(CommentContext);
  if (!ctx) throw new Error("Missing Commend Context");
  return ctx;
}
var CommentProvider = CommentContext.Provider;

// src/components/comment/actions.tsx
import { cva } from "class-variance-authority";
import { useEffect as useEffect2, useRef as useRef2 } from "react";

// src/components/comment/reply-form.tsx
import useSWRMutation2 from "swr/mutation";
import {
  useCallback as useCallback2,
  useState as useState4
} from "react";
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
function ReplyForm(_a) {
  var _b = _a, {
    editorRef,
    onCancel,
    comment
  } = _b, props = __objRest(_b, [
    "editorRef",
    "onCancel",
    "comment"
  ]);
  var _a2;
  const [isEmpty, setIsEmpty] = useState4(true);
  const { fetcher } = useCommentsContext();
  const mutation = useSWRMutation2(
    getCommentsKey({
      thread: (_a2 = comment.threadId) != null ? _a2 : comment.id,
      page: comment.page
    }),
    (key, { arg }) => fetcher.postComment(__spreadValues(__spreadValues({}, key[1]), arg)),
    {
      revalidate: false,
      onSuccess(data2) {
        var _a3;
        onCommentReplied(data2);
        onCancel == null ? void 0 : onCancel();
        (_a3 = editorRef.current) == null ? void 0 : _a3.commands.clearContent();
      }
    }
  );
  const submit = useLatestCallback(() => {
    if (!editorRef.current) return;
    const content = editorRef.current.getJSON();
    if (content.length === 0) return;
    clearPersistentId(`reply-${comment.id}`);
    void mutation.trigger({ content });
  });
  return /* @__PURE__ */ jsxs2(
    "form",
    __spreadProps(__spreadValues({}, props), {
      className: twMerge("relative", props.className),
      onSubmit: (e) => {
        submit();
        e.preventDefault();
      },
      children: [
        mutation.error ? /* @__PURE__ */ jsx3("p", { className: "mb-1 text-sm text-fc-error", children: mutation.error.message }) : null,
        /* @__PURE__ */ jsx3(
          CommentEditor,
          {
            persistentId: `reply-${comment.id}`,
            disabled: mutation.isMutating,
            editorRef,
            onChange: useCallback2((v) => {
              setIsEmpty(v.isEmpty);
            }, []),
            onEscape: onCancel,
            onSubmit: submit,
            placeholder: "Reply to comment"
          }
        ),
        /* @__PURE__ */ jsx3(
          "button",
          {
            "aria-label": "Reply",
            className: twMerge(
              buttonVariants({
                size: "icon",
                className: "absolute right-1.5 bottom-2"
              })
            ),
            disabled: mutation.isMutating || isEmpty,
            type: "submit",
            children: mutation.isMutating ? /* @__PURE__ */ jsx3(Spinner, {}) : /* @__PURE__ */ jsx3(SendHorizontal, { className: "size-4" })
          }
        )
      ]
    })
  );
}

// src/components/comment/actions.tsx
import { Fragment, jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
var rateVariants = cva(
  "inline-flex items-center gap-1.5 p-2 text-xs transition-colors rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fc-ring",
  {
    variants: {
      active: {
        true: "bg-fc-accent text-fc-accent-foreground",
        false: "text-fc-muted-foreground hover:text-fc-accent-foreground"
      }
    }
  }
);
function Actions({
  canReply = false
}) {
  const { fetcher } = useCommentsContext();
  const { comment, isReplying, setReply } = useCommentContext();
  const editorRef = useRef2(void 0);
  const { session } = useAuthContext();
  const isAuthenticated = session !== null;
  const isMobile = useIsMobile();
  function setLike(comment2, v) {
    if (v === comment2.liked) {
      void fetcher.deleteRate({
        id: comment2.id,
        page: comment2.page
      });
      onLikeUpdated(comment2.id, void 0);
    } else {
      void fetcher.setRate({
        id: comment2.id,
        page: comment2.page,
        like: v
      });
      onLikeUpdated(comment2.id, v);
    }
  }
  const onLike = () => {
    setLike(comment, true);
  };
  const onDislike = () => {
    setLike(comment, false);
  };
  useEffect2(() => {
    if (!isReplying) return;
    setTimeout(() => {
      var _a;
      (_a = editorRef.current) == null ? void 0 : _a.commands.focus("end");
    }, 100);
  }, [isReplying]);
  return /* @__PURE__ */ jsxs3(Fragment, { children: [
    /* @__PURE__ */ jsxs3("div", { className: "mt-2 flex flex-row -mx-2", children: [
      /* @__PURE__ */ jsxs3(
        "button",
        {
          className: twMerge(
            rateVariants({
              active: comment.liked === true
            })
          ),
          disabled: !isAuthenticated,
          onClick: onLike,
          type: "button",
          children: [
            /* @__PURE__ */ jsx4(ThumbsUp, { "aria-label": "Like", className: "size-4" }),
            comment.likes > 0 ? comment.likes : null
          ]
        }
      ),
      /* @__PURE__ */ jsxs3(
        "button",
        {
          className: twMerge(
            rateVariants({
              active: comment.liked === false
            })
          ),
          disabled: !isAuthenticated,
          onClick: onDislike,
          type: "button",
          children: [
            /* @__PURE__ */ jsx4(ThumbsDown, { "aria-label": "Dislike", className: "size-4" }),
            comment.dislikes > 0 ? comment.dislikes : null
          ]
        }
      ),
      canReply && isAuthenticated ? /* @__PURE__ */ jsxs3(
        "button",
        {
          type: "button",
          className: twMerge(rateVariants({ active: false })),
          onClick: () => setReply(!isReplying),
          children: [
            /* @__PURE__ */ jsx4(Reply, { className: "size-4" }),
            "\u56DE\u8986"
          ]
        }
      ) : null
    ] }),
    isMobile ? /* @__PURE__ */ jsx4(Dialog, { open: isReplying, onOpenChange: setReply, children: /* @__PURE__ */ jsxs3(
      DialogContent,
      {
        "aria-describedby": "reply-description",
        onOpenAutoFocus: (e) => e.preventDefault(),
        children: [
          /* @__PURE__ */ jsxs3(DialogTitle, { className: "text-sm mb-4", children: [
            "\u6B63\u5728\u56DE\u8986 ",
            comment.author.name
          ] }),
          /* @__PURE__ */ jsx4(
            ReplyForm,
            {
              editorRef,
              comment,
              onCancel: () => setReply(false)
            }
          )
        ]
      }
    ) }) : null,
    !isMobile && isReplying ? /* @__PURE__ */ jsx4(
      ReplyForm,
      {
        className: "mt-2",
        editorRef,
        comment,
        onCancel: () => setReply(false)
      }
    ) : null
  ] });
}

// src/components/comment/index.tsx
import {
  useState as useState7,
  useMemo as useMemo2,
  useRef as useRef3
} from "react";
import useSWRMutation4 from "swr/mutation";

// src/components/menu.tsx
import * as Primitive from "@radix-ui/react-dropdown-menu";
import { cva as cva2 } from "class-variance-authority";
import { forwardRef as forwardRef2 } from "react";
import { jsx as jsx5 } from "react/jsx-runtime";
var menuItemVariants = cva2(
  "inline-flex flex-row items-center justify-between cursor-pointer px-3 py-2 text-start focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-80 [&_svg]:size-3.5",
  {
    variants: {
      variant: {
        destructive: "text-fc-danger data-[highlighted]:bg-fc-danger/10",
        default: "data-[highlighted]:bg-fc-accent data-[highlighted]:text-fc-accent-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
var menuItemsVariants = cva2(
  "flex w-56 flex-col overflow-hidden rounded-lg border border-fc-border bg-fc-popover text-sm text-fc-popover-foreground shadow-lg z-50 focus-visible:outline-none data-[state=closed]:animate-fadeOut"
);
var MenuItems = forwardRef2((_a, ref) => {
  var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
  return /* @__PURE__ */ jsx5(Primitive.Portal, { children: /* @__PURE__ */ jsx5(
    Primitive.Content,
    __spreadProps(__spreadValues({
      className: twMerge(menuItemsVariants({ className })),
      ref
    }, props), {
      children: props.children
    })
  ) });
});
MenuItems.displayName = "MenuItems";
var MenuItem = forwardRef2((_a, ref) => {
  var _b = _a, { className, variant } = _b, props = __objRest(_b, ["className", "variant"]);
  return /* @__PURE__ */ jsx5(
    Primitive.Item,
    __spreadProps(__spreadValues({
      className: twMerge(menuItemVariants({ className, variant })),
      ref
    }, props), {
      children: props.children
    })
  );
});
MenuItem.displayName = "MenuItem";
var MenuTrigger = Primitive.Trigger;
var Menu = Primitive.Root;

// src/components/avatar.tsx
import { jsx as jsx6 } from "react/jsx-runtime";
function Avatar(_a) {
  var _b = _a, {
    image,
    placeholder = "avatar"
  } = _b, props = __objRest(_b, [
    "image",
    "placeholder"
  ]);
  if (image) {
    return /* @__PURE__ */ jsx6(
      "img",
      __spreadProps(__spreadValues({
        src: image,
        alt: placeholder
      }, props), {
        className: twMerge(
          "size-8 select-none rounded-full bg-fc-muted",
          props.className
        ),
        "aria-label": "avatar"
      })
    );
  }
  return /* @__PURE__ */ jsx6(
    "div",
    __spreadProps(__spreadValues({}, props), {
      "aria-label": placeholder,
      className: twMerge(
        "size-8 rounded-full bg-gradient-to-br from-blue-600 to-red-600",
        props.className
      )
    })
  );
}

// src/components/comment/edit-form.tsx
import useSWRMutation3 from "swr/mutation";
import { useCallback as useCallback3, useState as useState5 } from "react";
import { jsx as jsx7, jsxs as jsxs4 } from "react/jsx-runtime";
function EditForm() {
  const [isEmpty, setIsEmpty] = useState5(false);
  const { comment, editorRef, setEdit } = useCommentContext();
  const { fetcher } = useCommentsContext();
  const mutation = useSWRMutation3(
    getCommentsKey({
      page: comment.page,
      thread: comment.threadId
    }),
    (_, { arg }) => fetcher.editComment(__spreadValues({
      id: comment.id,
      page: comment.page
    }, arg)),
    {
      revalidate: false
    }
  );
  const onClose = useLatestCallback(() => {
    setEdit(false);
  });
  const submit = useLatestCallback(() => {
    if (!editorRef.current) return;
    const content = editorRef.current.getJSON();
    if (content.length === 0) return;
    clearPersistentId(`edit-${comment.id}`);
    void mutation.trigger(
      { content },
      {
        onSuccess() {
          setEdit(false);
          updateComment(comment.id, (item) => __spreadProps(__spreadValues({}, item), { content }));
        }
      }
    );
  });
  return /* @__PURE__ */ jsxs4(
    "form",
    {
      onSubmit: (e) => {
        submit();
        e.preventDefault();
      },
      children: [
        /* @__PURE__ */ jsx7(
          CommentEditor,
          {
            persistentId: `edit-${comment.id}`,
            defaultValue: comment.content,
            disabled: mutation.isMutating,
            editorRef,
            onChange: useCallback3((v) => {
              setIsEmpty(v.isEmpty);
            }, []),
            onEscape: onClose,
            onSubmit: submit,
            placeholder: "\u7DE8\u8F2F\u8A0A\u606F"
          }
        ),
        /* @__PURE__ */ jsxs4("div", { className: "mt-2 flex flex-row gap-1", children: [
          /* @__PURE__ */ jsxs4(
            "button",
            {
              "aria-label": "Edit",
              className: twMerge(
                buttonVariants({ variant: "primary", className: "gap-2" })
              ),
              disabled: mutation.isMutating || isEmpty,
              type: "submit",
              children: [
                mutation.isMutating ? /* @__PURE__ */ jsx7(Spinner, {}) : /* @__PURE__ */ jsx7(Pencil, { className: "size-4" }),
                "\u7DE8\u8F2F"
              ]
            }
          ),
          /* @__PURE__ */ jsx7(
            "button",
            {
              className: twMerge(buttonVariants({ variant: "secondary" })),
              onClick: onClose,
              type: "button",
              children: "\u53D6\u6D88"
            }
          )
        ] })
      ]
    }
  );
}

// src/components/timestamp.tsx
import { useLayoutEffect, useState as useState6 } from "react";

// src/utils/date.ts
function toLocalString(date) {
  const today = new Date(Date.now());
  const isToday = date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
  const day = isToday ? "\u4ECA\u5929" : [
    date.getDate().toString().padStart(2, "0"),
    (date.getMonth() + 1).toString().padStart(2, "0"),
    date.getFullYear()
  ].join("/");
  const time = [
    date.getHours().toString().padStart(2, "0"),
    date.getMinutes().toString().padStart(2, "0")
  ].join(":");
  return `${day} ${time}`;
}

// src/components/timestamp.tsx
function Timestamp({
  timestamp
}) {
  const [str, setStr] = useState6("");
  useLayoutEffect(() => {
    setStr(toLocalString(new Date(timestamp)));
  }, [timestamp]);
  return str;
}

// src/components/comment/index.tsx
import { Fragment as Fragment2, jsx as jsx8, jsxs as jsxs5 } from "react/jsx-runtime";
function Comment(_a) {
  var _b = _a, {
    comment: cached,
    actions,
    children
  } = _b, props = __objRest(_b, [
    "comment",
    "actions",
    "children"
  ]);
  var _a2;
  const [edit, setEdit] = useState7(false);
  const [isReply, setIsReply] = useState7(false);
  const editorRef = useRef3(void 0);
  const comment = (_a2 = useCommentManager(cached.id)) != null ? _a2 : cached;
  const context = useMemo2(() => {
    return {
      isEditing: edit,
      isReplying: isReply,
      setEdit,
      editorRef,
      setReply: setIsReply,
      comment
    };
  }, [comment, edit, isReply]);
  return /* @__PURE__ */ jsxs5(CommentProvider, { value: context, children: [
    /* @__PURE__ */ jsxs5(
      "div",
      __spreadProps(__spreadValues({}, props), {
        className: twMerge(
          "relative flex flex-row gap-2 p-4 text-sm",
          props.className
        ),
        "data-fc-comment": context.comment.id,
        "data-fc-edit": context.isEditing,
        "data-fc-reply": context.isReplying,
        children: [
          /* @__PURE__ */ jsx8(
            Avatar,
            {
              placeholder: comment.author.name,
              image: comment.author.image,
              className: "shrink-0"
            }
          ),
          /* @__PURE__ */ jsxs5("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxs5("div", { className: "flex flex-row items-center gap-2", children: [
              /* @__PURE__ */ jsx8("span", { className: "truncate font-medium", children: comment.author.name }),
              /* @__PURE__ */ jsx8("span", { className: "text-xs text-fc-muted-foreground", children: /* @__PURE__ */ jsx8(Timestamp, { timestamp: comment.timestamp }) }),
              /* @__PURE__ */ jsx8(CommentMenu, { className: "ms-auto -my-2" })
            ] }),
            edit ? /* @__PURE__ */ jsx8(EditForm, {}) : /* @__PURE__ */ jsxs5(Fragment2, { children: [
              /* @__PURE__ */ jsx8(ContentRenderer, { content: comment.content }),
              actions
            ] })
          ] })
        ]
      })
    ),
    children
  ] });
}
function CommentMenu(_a) {
  var _b = _a, {
    className
  } = _b, props = __objRest(_b, [
    "className"
  ]);
  var _a2;
  const { session } = useAuthContext();
  const { comment, editorRef, isEditing, isReplying, setEdit } = useCommentContext();
  const { fetcher } = useCommentsContext();
  const deleteMutation = useSWRMutation4(
    getCommentsKey({
      thread: comment.threadId,
      page: comment.page
    }),
    () => fetcher.deleteComment(comment),
    {
      onSuccess() {
        onCommentDeleted(comment);
      },
      revalidate: false
    }
  );
  const canEdit = session !== null && session.id === comment.author.id;
  const canDelete = session !== null && (((_a2 = session.permissions) == null ? void 0 : _a2.delete) || session.id === comment.author.id);
  const onCopy = () => {
    const text = getTextFromContent(comment.content);
    void navigator.clipboard.writeText(text);
  };
  const onEdit = () => {
    setEdit(true);
  };
  const onDelete = () => {
    void deleteMutation.trigger();
  };
  return /* @__PURE__ */ jsxs5(Menu, { children: [
    /* @__PURE__ */ jsx8(
      MenuTrigger,
      __spreadProps(__spreadValues({
        "aria-label": "Open Menu",
        className: twMerge(
          buttonVariants({
            size: "icon",
            variant: "ghost",
            className: "text-fc-muted-foreground data-[state=open]:bg-fc-accent data-[state=open]:text-fc-accent-foreground disabled:invisible"
          }),
          className
        ),
        disabled: isEditing || isReplying
      }, props), {
        children: /* @__PURE__ */ jsx8(EllipsisVertical, { className: "size-4" })
      })
    ),
    /* @__PURE__ */ jsxs5(
      MenuItems,
      {
        onCloseAutoFocus: (e) => {
          var _a3;
          (_a3 = editorRef.current) == null ? void 0 : _a3.commands.focus("end");
          e.preventDefault();
        },
        children: [
          /* @__PURE__ */ jsxs5(MenuItem, { onSelect: onCopy, children: [
            "\u8907\u88FD",
            /* @__PURE__ */ jsx8(Copy, {})
          ] }),
          canEdit ? /* @__PURE__ */ jsxs5(MenuItem, { onSelect: onEdit, children: [
            "\u7DE8\u8F2F",
            /* @__PURE__ */ jsx8(Pencil, {})
          ] }) : null,
          canDelete ? /* @__PURE__ */ jsxs5(
            MenuItem,
            {
              disabled: deleteMutation.isMutating,
              onSelect: onDelete,
              variant: "destructive",
              children: [
                "\u522A\u9664",
                /* @__PURE__ */ jsx8(Trash2, {})
              ]
            }
          ) : null
        ]
      }
    )
  ] });
}
function getTextFromContent(content) {
  var _a, _b, _c;
  if (content.type === "text") return (_a = content.text) != null ? _a : "";
  const child = ((_c = (_b = content.content) == null ? void 0 : _b.map((c) => getTextFromContent(c))) != null ? _c : []).join("").trimEnd();
  if (content.type === "paragraph") return `${child}
`;
  return child;
}

// src/components/comment/list.tsx
import { jsx as jsx9, jsxs as jsxs6 } from "react/jsx-runtime";
var count = 40;
var defaultComponents = {
  Comment: ({ comment }) => /* @__PURE__ */ jsx9(Comment, { comment, actions: /* @__PURE__ */ jsx9(Actions, { canReply: true }), children: /* @__PURE__ */ jsx9(Replies, {}) })
};
function CommentList(_a) {
  var _b = _a, {
    ref,
    threadId,
    isSubThread = false,
    components: _components = {}
  } = _b, props = __objRest(_b, [
    "ref",
    "threadId",
    "isSubThread",
    "components"
  ]);
  const { page, fetcher } = useCommentsContext();
  const [cursor, setCursor] = useState8();
  const { Comment: Comment2 = defaultComponents.Comment } = useRef4(_components).current;
  const list = useCommentList([page, threadId]);
  const query = useSWRImmutable2(
    getCommentsKey({
      thread: threadId,
      page,
      sort: isSubThread ? "oldest" : "newest",
      [isSubThread ? "after" : "before"]: typeof cursor === "number" ? new Date(cursor) : void 0,
      limit: count
    }),
    ([_, options]) => fetcher.fetchComments(options),
    {
      onSuccess(data2) {
        updateCommentList([page, threadId], (v = []) => [...v, ...data2]);
        syncComments(data2);
      }
    }
  );
  return /* @__PURE__ */ jsxs6("div", __spreadProps(__spreadValues({ ref }, props), { className: twMerge("flex flex-col", props.className), children: [
    !query.isLoading && cursor === void 0 && list.length === 0 && /* @__PURE__ */ jsx9("p", { className: "mx-auto my-4 text-center text-sm text-fc-muted-foreground", children: "\u76EE\u524D\u6C92\u6709\u4EFB\u4F55\u8A55\u8AD6\uFF0C\u6B61\u8FCE\u6210\u70BA\u7B2C\u4E00\u4F4D\u8A55\u8AD6\u8005\uFF01" }),
    list.map((reply) => /* @__PURE__ */ jsx9(Comment2, { comment: reply }, reply.id)),
    query.data && query.data.length >= count ? /* @__PURE__ */ jsx9(
      "button",
      {
        type: "button",
        className: twMerge(
          buttonVariants({
            variant: "secondary",
            size: "medium",
            className: "mx-auto my-2"
          })
        ),
        onClick: () => {
          if (list.length > 0)
            setCursor(new Date(list[list.length - 1].timestamp).getTime());
        },
        children: "\u8F09\u5165\u66F4\u591A"
      }
    ) : null,
    query.isLoading ? /* @__PURE__ */ jsx9(Spinner, { className: "mx-auto my-4" }) : null
  ] }));
}
function Replies() {
  const { comment } = useCommentContext();
  const auth = useAuthContext();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState8(false);
  const editorRef = useRef4(void 0);
  if (comment.replies === 0) return null;
  const button = /* @__PURE__ */ jsxs6(
    "button",
    {
      type: "button",
      className: twMerge(
        buttonVariants({
          variant: "ghost",
          size: "medium",
          className: "w-full text-start justify-start gap-2 pl-13.5 bg-fc-card rounded-none"
        })
      ),
      children: [
        /* @__PURE__ */ jsx9(
          ChevronDown,
          {
            className: twMerge("size-4 transition-transform", open && "rotate-180")
          }
        ),
        comment.replies,
        " \u56DE\u8986"
      ]
    }
  );
  if (isMobile) {
    return /* @__PURE__ */ jsxs6(Dialog, { open, onOpenChange: setOpen, children: [
      /* @__PURE__ */ jsx9(DialogTrigger, { asChild: true, children: button }),
      /* @__PURE__ */ jsxs6(DialogContent, { className: "h-[70vh]", children: [
        /* @__PURE__ */ jsx9(DialogTitle, { children: "\u7559\u8A00" }),
        /* @__PURE__ */ jsx9(
          CommentList,
          {
            threadId: comment.id,
            isSubThread: true,
            className: "flex-1 -mx-4 overflow-y-auto",
            components: {
              Comment: ({ comment: comment2 }) => /* @__PURE__ */ jsx9(Comment, { comment: comment2, actions: /* @__PURE__ */ jsx9(Actions, {}) })
            }
          }
        ),
        auth.isLoading || auth.session ? /* @__PURE__ */ jsx9(
          ReplyForm,
          {
            comment,
            editorRef,
            className: "bg-fc-popover"
          }
        ) : null
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs6(Collapsible, { className: "bg-fc-card", open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx9(CollapsibleTrigger, { asChild: true, children: button }),
    /* @__PURE__ */ jsx9(CollapsibleContent, { className: "overflow-hidden data-[state=closed]:animate-fc-accordion-up data-[state=open]:animate-fc-accordion-down", children: /* @__PURE__ */ jsx9(
      CommentList,
      {
        threadId: comment.id,
        isSubThread: true,
        components: {
          Comment: ({ comment: comment2 }) => /* @__PURE__ */ jsx9(
            Comment,
            {
              comment: comment2,
              actions: /* @__PURE__ */ jsx9(Actions, { canReply: true }),
              className: "ml-10"
            }
          )
        }
      }
    ) })
  ] });
}

// src/atom.tsx
import { jsx as jsx10 } from "react/jsx-runtime";
function CommentsProvider2({
  page,
  children,
  mention,
  storage,
  auth,
  apiUrl
}) {
  let child = children;
  const context = useMemo3(
    () => ({
      page,
      fetcher: createFetcher(apiUrl)
    }),
    [page, apiUrl]
  );
  if (mention)
    child = /* @__PURE__ */ jsx10(MentionProvider, { mention, children: child });
  if (storage)
    child = /* @__PURE__ */ jsx10(StorageProvider, { storage, children: child });
  return /* @__PURE__ */ jsx10(CommentsProvider, { value: context, children: /* @__PURE__ */ jsx10(AuthProvider, { page, auth, children: child }) });
}
var CommentsPost = CreateForm;
var CommentsList = forwardRef3((_a, ref) => {
  var _b = _a, { className } = _b, props = __objRest(_b, ["className"]);
  return /* @__PURE__ */ jsx10("div", __spreadProps(__spreadValues({ className: twMerge("flex flex-col", className), ref }, props), { children: /* @__PURE__ */ jsx10(CommentList, {}) }));
});
CommentsList.displayName = "CommentsList";
function AuthButton(props) {
  var _a;
  const { signIn } = useAuthContext();
  if (typeof signIn === "function")
    return /* @__PURE__ */ jsx10("button", __spreadProps(__spreadValues({}, props), { onClick: signIn, type: "button", children: (_a = props.children) != null ? _a : "\u767B\u5165" }));
  return signIn;
}

export {
  Comment,
  CommentsProvider2 as CommentsProvider,
  CommentsPost,
  CommentsList,
  AuthButton
};
