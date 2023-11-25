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
        "fc-h-4 fc-w-4 fc-rounded-full fc-border-2 fc-border-border",
        className
      )}
      ref={ref}
      {...props}
    >
      <div className="fc-h-full fc-w-full fc-animate-spin fc-rounded-full fc-border-l-2 fc-border-primary" />
    </div>
  );
});

Spinner.displayName = "Spinner";
