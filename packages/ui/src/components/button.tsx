import { cva } from "cva";

export const buttonVariants = cva(
  "fc-inline-flex fc-text-sm fc-font-medium fc-justify-center fc-items-center disabled:fc-text-muted-foreground disabled:fc-bg-muted disabled:fc-pointer-events-none",
  {
    variants: {
      variant: {
        icon: "fc-w-7 fc-h-7 fc-bg-primary fc-text-primary-foreground fc-transition-colors fc-rounded-full hover:fc-bg-primary/80",
        primary:
          "fc-w-20 fc-h-8 fc-bg-primary fc-text-primary-foreground fc-transition-colors fc-rounded-full hover:fc-bg-primary/80",
        ghost:
          "fc-px-2 fc-py-1.5 fc-text-muted-foreground fc-transition-colors fc-rounded-lg hover:fc-bg-accent/80",
      },
    },
  }
);
