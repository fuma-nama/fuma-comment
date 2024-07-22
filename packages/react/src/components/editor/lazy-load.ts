import { type Editor } from "@tiptap/react";
import { type CreateEditorOptions } from "./create-editor";

export async function createEditorLazy(
  options: CreateEditorOptions,
): Promise<Editor> {
  return import("./create-editor").then((mod) => mod.createEditor(options));
}
