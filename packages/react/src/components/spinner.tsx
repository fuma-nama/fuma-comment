import type { HTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "../utils/cn";

export const Spinner = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      className={cn(
        "fc-w-4 fc-h-4 fc-rounded-full fc-border-2 fc-border-border",
        className
      )}
      ref={ref}
      {...props}
    >
      <div className="fc-w-full fc-h-full fc-rounded-full fc-border-l-2 fc-border-primary fc-animate-spin" />
    </div>
  );
});

Spinner.displayName = "Spinner";
