import { cva } from "cva";

export const buttonVariants = cva(
  "fc-inline-flex fc-font-medium fc-justify-center fc-items-center disabled:fc-text-muted-foreground disabled:fc-bg-muted disabled:fc-pointer-events-none",
  {
    variants: {
      size: {
        small: "fc-text-xs fc-px-2 fc-h-8",
        medium: "fc-text-sm fc-px-2 fc-h-8",
        default: "fc-text-sm fc-w-20 fc-h-8",
        icon: "fc-w-7 fc-h-7",
      },
      variant: {
        primary:
          "fc-bg-primary fc-text-primary-foreground fc-transition-colors fc-rounded-full hover:fc-bg-primary/80",
        secondary:
          "fc-bg-card fc-border fc-border-border fc-transition-colors fc-rounded-full hover:fc-bg-accent",
        ghost:
          "fc-text-muted-foreground fc-transition-colors fc-rounded-lg hover:fc-bg-accent/80",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);
