import {
  Spinner
} from "./chunk-SIPNGVYW.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  toggleVariants,
  useHookUpdate
} from "./chunk-35YJQ6GS.js";
import {
  Image,
  buttonVariants,
  twMerge,
  useObjectURL,
  useStorage
} from "./chunk-5NN7OVAV.js";
import "./chunk-BBZEL7EG.js";

// src/components/editor/image-upload.tsx
import { useState } from "react";
import useSWRMutation from "swr/mutation";
import { jsx, jsxs } from "react/jsx-runtime";
function UploadImageButton({
  editor
}) {
  useHookUpdate(editor);
  const [isOpen, setIsOpen] = useState(false);
  return /* @__PURE__ */ jsxs(Dialog, { onOpenChange: setIsOpen, open: isOpen, children: [
    /* @__PURE__ */ jsx(
      DialogTrigger,
      {
        type: "button",
        "aria-label": "Upload Image",
        className: twMerge(toggleVariants()),
        disabled: !editor.can().setImage({ src: "" }) || !editor.isEditable,
        children: /* @__PURE__ */ jsx(Image, { className: "size-4" })
      }
    ),
    /* @__PURE__ */ jsxs(DialogContent, { onCloseAutoFocus: (e) => e.preventDefault(), children: [
      /* @__PURE__ */ jsx(DialogTitle, { children: "Upload Image" }),
      /* @__PURE__ */ jsx(DialogDescription, { children: "Attach your own image to comment." }),
      /* @__PURE__ */ jsx(
        UploadImage,
        {
          editor,
          onClose: () => {
            setIsOpen(false);
            editor.commands.focus();
          }
        }
      )
    ] })
  ] });
}
function UploadImage({
  editor,
  onClose
}) {
  const storage = useStorage();
  const [file, setFile] = useState(null);
  const fileUrl = useObjectURL(file);
  const mutation = useSWRMutation(
    "fc-upload-image",
    (_, { arg }) => storage.upload(arg.file),
    {
      onSuccess(data) {
        editor.commands.setImage({
          src: data.url,
          alt: data.alt,
          // @ts-expect-error -- add width, height properties
          width: data.width,
          height: data.height
        });
        onClose();
      }
    }
  );
  return /* @__PURE__ */ jsxs(
    "form",
    {
      className: "flex flex-col",
      onSubmit: (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (file) {
          void mutation.trigger({ file });
        }
      },
      children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            accept: "image/png, image/jpeg",
            hidden: true,
            id: "image",
            onChange: (e) => {
              if (e.target.files && e.target.files.length > 0) {
                setFile(e.target.files.item(0));
              }
            },
            type: "file",
            disabled: mutation.isMutating
          }
        ),
        fileUrl ? /* @__PURE__ */ jsxs(
          "label",
          {
            className: twMerge(
              "relative overflow-hidden rounded-xl border border-fc-border bg-fc-muted",
              mutation.isMutating ? "cursor-not-allowed" : "cursor-pointer"
            ),
            htmlFor: "image",
            children: [
              mutation.isMutating ? /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-xs backdrop-blur-lg backdrop-brightness-50", children: [
                /* @__PURE__ */ jsx(Spinner, { className: "size-8" }),
                "Uploading"
              ] }) : null,
              /* @__PURE__ */ jsx("img", { alt: "preview", className: "mx-auto max-h-96", src: fileUrl })
            ]
          }
        ) : /* @__PURE__ */ jsx(
          "label",
          {
            className: "cursor-pointer rounded-xl border border-fc-border bg-fc-background p-4 text-center text-sm font-medium text-fc-muted-foreground",
            htmlFor: "image",
            children: "Upload Image"
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "mt-4 flex gap-1", children: /* @__PURE__ */ jsx(
          "button",
          {
            className: twMerge(buttonVariants()),
            disabled: mutation.isMutating,
            type: "submit",
            children: "Save"
          }
        ) })
      ]
    }
  );
}
export {
  UploadImageButton as default
};
