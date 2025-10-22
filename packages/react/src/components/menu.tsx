import * as Primitive from "@radix-ui/react-dropdown-menu";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../utils/cn";

const menuItemVariants = cva(
  "inline-flex flex-row items-center justify-between cursor-pointer px-3 py-2 text-start focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-80 [&_svg]:size-3.5",
  {
    variants: {
      variant: {
        destructive: "text-fc-danger data-highlighted:bg-fc-danger/10",
        default:
          "data-highlighted:bg-fc-accent data-highlighted:text-fc-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Menu = Primitive.Root;

const MenuTrigger = Primitive.Trigger;

function MenuItems({
  className,
  ...props
}: ComponentProps<typeof Primitive.Content>): ReactNode {
  return (
    <Primitive.Portal>
      <Primitive.Content
        className={cn(
          "flex w-56 flex-col overflow-hidden rounded-lg border border-fc-border bg-fc-popover text-sm text-fc-popover-foreground shadow-lg z-50 focus-visible:outline-none data-[state=closed]:animate-fc-fadeOut",
          className,
        )}
        {...props}
      >
        {props.children}
      </Primitive.Content>
    </Primitive.Portal>
  );
}

function MenuItem({
  className,
  variant,
  ...props
}: Primitive.DropdownMenuItemProps &
  VariantProps<typeof menuItemVariants>): ReactNode {
  return (
    <Primitive.Item
      className={cn(menuItemVariants({ className, variant }))}
      {...props}
    >
      {props.children}
    </Primitive.Item>
  );
}

export { Menu, MenuTrigger, MenuItems, MenuItem };
