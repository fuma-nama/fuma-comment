import type { Editor } from "@tiptap/react";
import { useState } from "react";
import useSWRMutation from "swr/mutation";
import { useStorage } from "../../contexts/storage";
import { useLatestCallback, useObjectURL } from "../../utils/hooks";
import { cn } from "../../utils/cn";
import { Spinner } from "../spinner";
import { buttonVariants } from "../button";

export function UploadImage({
  editor,
  onClose,
}: {
  editor: Editor;
  onClose: () => void;
}): React.ReactElement {
  const storage = useStorage();
  const [file, setFile] = useState<Blob | null>(null);
  const fileUrl = useObjectURL(file);
  const mutation = useSWRMutation(
    "fc-upload-image",
    (_, { arg }: { arg: { file: Blob } }) => storage.upload(arg.file),
    {
      onSuccess(data) {
        editor.commands.setImage({
          src: data.url,
          alt: data.alt,
          // @ts-expect-error -- add width, height properties
          width: data.width,
          height: data.height,
        });
        onClose();
      },
    },
  );

  const onSubmit = useLatestCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (file) {
      void mutation.trigger({ file });
    }
  });

  const onChange = useLatestCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        setFile(e.target.files.item(0));
      }
    },
  );

  return (
    <form className="flex flex-col" onSubmit={onSubmit}>
      <input
        accept="image/png, image/jpeg"
        hidden
        id="image"
        onChange={onChange}
        type="file"
        disabled={mutation.isMutating}
      />
      {fileUrl ? (
        <label
          className={cn(
            "relative overflow-hidden rounded-xl border border-fc-border bg-fc-muted",
            mutation.isMutating ? "cursor-not-allowed" : "cursor-pointer",
          )}
          htmlFor="image"
        >
          {mutation.isMutating ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-xs backdrop-blur-lg backdrop-brightness-50">
              <Spinner className="size-8" />
              Uploading
            </div>
          ) : null}
          <img alt="preview" className="mx-auto max-h-96" src={fileUrl} />
        </label>
      ) : (
        <label
          className="cursor-pointer rounded-xl border border-fc-border bg-fc-background p-4 text-center text-sm font-medium text-fc-muted-foreground"
          htmlFor="image"
        >
          Upload Image
        </label>
      )}

      <div className="mt-2 flex gap-1">
        <button
          className={cn(buttonVariants())}
          disabled={mutation.isMutating}
          type="submit"
        >
          Save
        </button>
      </div>
    </form>
  );
}
