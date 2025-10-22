import type { ComponentProps, ReactNode } from "react";
import { cn } from "../utils/cn";

function Avatar({
  src,
  alt = "avatar",
  ...props
}: ComponentProps<"img">): ReactNode {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        {...props}
        className={cn(
          "size-8 select-none rounded-full bg-fc-muted",
          props.className,
        )}
        aria-label="avatar"
      />
    );
  }

  return (
    <div
      {...props}
      aria-describedby={alt}
      className={cn(
        "size-8 rounded-full bg-linear-to-br from-blue-600 to-red-600",
        props.className,
      )}
    />
  );
}

export { Avatar };
