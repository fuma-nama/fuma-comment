import { cva } from "class-variance-authority";

export const inputVariants = cva(
	"px-2 py-1.5 text-sm placeholder:text-fc-muted-foreground focus-visible:outline-none",
	{
		variants: {
			variant: {
				ghost: "border-b",
				default:
					"rounded-md border border-fc-border bg-fc-background focus-visible:ring-2 focus-visible:ring-fc-ring",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);
