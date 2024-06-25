import { cva } from "cva";

export const buttonVariants = cva(
  "fc-inline-flex fc-items-center fc-justify-center fc-rounded-lg fc-font-medium disabled:fc-pointer-events-none disabled:fc-bg-muted disabled:fc-text-muted-foreground",
  {
    variants: {
      size: {
        small: "fc-h-8 fc-px-2 fc-text-xs",
        medium: "fc-px-3 fc-py-2 fc-text-sm",
        default: "fc-h-8 fc-w-20 fc-text-sm",
        icon: "fc-h-7 fc-w-7 fc-rounded-full",
      },
      variant: {
        primary:
          "fc-bg-primary fc-text-primary-foreground fc-transition-colors hover:fc-bg-primary/80",
        secondary:
          "fc-border fc-border-border fc-bg-card fc-transition-colors hover:fc-bg-accent",
        ghost: "fc-transition-colors hover:fc-bg-accent/80",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);
