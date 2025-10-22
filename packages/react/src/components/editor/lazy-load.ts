import type { Editor } from "@tiptap/react";
import type { CreateEditorOptions } from "./create-editor";

async function createEditorLazy(options: CreateEditorOptions): Promise<Editor> {
  return import("./create-editor").then((mod) => mod.createEditor(options));
}

export { createEditorLazy };
