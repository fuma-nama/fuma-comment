import { cva } from "class-variance-authority";

export const inputVariants = cva(
  "appearance-none px-2 py-1.5 placeholder:text-fc-muted-foreground focus-visible:outline-none",
  {
    variants: {
      variant: {
        ghost: "px-4 py-3.5 border-b",
        default:
          "rounded-md border border-fc-border bg-fc-background focus-visible:ring-2 focus-visible:ring-fc-ring",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
