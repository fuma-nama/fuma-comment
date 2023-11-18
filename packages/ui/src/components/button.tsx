import { cva } from "cva";

export const buttonVariants = cva(
  "fc-inline-flex fc-font-medium fc-justify-center fc-items-center fc-rounded-lg disabled:fc-text-muted-foreground disabled:fc-bg-muted disabled:fc-pointer-events-none",
  {
    variants: {
      size: {
        small: "fc-text-xs fc-px-2 fc-h-8",
        medium: "fc-px-3 fc-py-2 fc-text-sm",
        default: "fc-text-sm fc-w-20 fc-h-8",
        icon: "fc-w-7 fc-h-7 fc-rounded-full",
      },
      variant: {
        primary:
          "fc-bg-primary fc-text-primary-foreground fc-transition-colors hover:fc-bg-primary/80",
        secondary:
          "fc-bg-card fc-border fc-border-border fc-transition-colors hover:fc-bg-accent",
        ghost: "fc-transition-colors hover:fc-bg-accent/80",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);
