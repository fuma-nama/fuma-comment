import * as Primitive from "@radix-ui/react-dropdown-menu";
import { cva } from "cva";
import { forwardRef } from "react";
import { cn } from "../utils/cn";

const menuItemVariants = cva(
  "cursor-pointer px-3 py-1.5 text-left focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-80 data-[highlighted]:bg-fc-accent data-[highlighted]:text-fc-accent-foreground",
);

const menuItemsVariants = cva(
  "flex w-56 flex-col divide-y divide-fc-border overflow-hidden rounded-md border border-fc-border bg-fc-popover text-sm text-fc-popover-foreground shadow-lg focus-visible:outline-none data-[state=closed]:animate-fadeOut",
);

const MenuItems = forwardRef<
  HTMLDivElement,
  Primitive.DropdownMenuContentProps
>(({ className, ...props }, ref) => {
  return (
    <Primitive.Portal>
      <Primitive.Content
        className={cn(menuItemsVariants({ className }))}
        ref={ref}
        {...props}
      >
        {props.children}
      </Primitive.Content>
    </Primitive.Portal>
  );
});

MenuItems.displayName = "MenuItems";

const MenuItem = forwardRef<HTMLDivElement, Primitive.DropdownMenuItemProps>(
  ({ className, ...props }, ref) => {
    return (
      <Primitive.Item
        className={cn(menuItemVariants({ className }))}
        ref={ref}
        {...props}
      >
        {props.children}
      </Primitive.Item>
    );
  },
);

MenuItem.displayName = "MenuItem";

const MenuTrigger = Primitive.Trigger;
const Menu = Primitive.Root;

export { Menu, MenuItems, MenuItem, MenuTrigger };
