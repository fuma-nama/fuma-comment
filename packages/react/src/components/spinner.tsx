import type { HTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "../utils/cn";

export const Spinner = forwardRef<
	HTMLDivElement,
	HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
	return (
		<div
			className={cn("size-4 rounded-full border-2 border-fc-border", className)}
			ref={ref}
			{...props}
		>
			<div className="size-full animate-spin rounded-full border-l-2 border-fc-primary" />
		</div>
	);
});

Spinner.displayName = "Spinner";
