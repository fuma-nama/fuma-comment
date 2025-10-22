import { Loader2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../utils/cn";

function Spinner({ className, ...props }: ComponentProps<"svg">): ReactNode {
  return (
    <Loader2
      className={cn("size-4 animate-spin rounded-full", className)}
      {...props}
    />
  );
}

export { Spinner };
