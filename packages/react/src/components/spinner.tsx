import { Loader2 } from "lucide-react";
import type { HTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "../utils/cn";

export const Spinner = forwardRef<SVGSVGElement, HTMLAttributes<SVGSVGElement>>(
  ({ className, ...props }, ref) => {
    return (
      <Loader2
        className={cn("size-4 animate-spin rounded-full", className)}
        ref={ref}
        {...props}
      />
    );
  },
);

Spinner.displayName = "Spinner";
