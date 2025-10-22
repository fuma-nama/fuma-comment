import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium cursor-pointer disabled:pointer-events-none disabled:bg-fc-muted disabled:text-fc-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fc-ring",
  {
    variants: {
      size: {
        small: "h-8 px-2 text-xs",
        medium: "px-3 py-2 text-sm",
        default: "h-8 min-w-20 text-sm",
        icon: "size-7 rounded-full",
      },
      variant: {
        primary:
          "bg-fc-primary text-fc-primary-foreground transition-colors hover:bg-fc-primary/80",
        secondary:
          "border border-fc-border bg-fc-card transition-colors hover:bg-fc-accent",
        ghost: "transition-colors hover:bg-fc-accent/80",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export { buttonVariants };
