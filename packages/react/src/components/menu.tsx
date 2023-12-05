import * as Primitive from "@radix-ui/react-dropdown-menu";
import { cva } from "cva";
import { forwardRef } from "react";
import { cn } from "../utils/cn";

const menuItemVariants = cva(
  "fc-cursor-pointer fc-px-3 fc-py-1.5 fc-text-left fc-transition-colors focus-visible:fc-outline-none disabled:fc-cursor-not-allowed disabled:fc-opacity-80 highlighted:fc-bg-accent highlighted:fc-text-accent-foreground"
);

const menuItemsVariants = cva(
  "fc-flex fc-w-56 fc-animate-fadeIn fc-flex-col fc-divide-y fc-divide-border fc-overflow-hidden fc-rounded-md fc-bg-popover fc-text-sm fc-text-popover-foreground fc-shadow-lg focus-visible:fc-outline-none focus-visible:fc-ring-1 focus-visible:fc-ring-ring state-closed:fc-animate-fadeOut"
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
  }
);

MenuItem.displayName = "MenuItem";

const MenuTrigger = Primitive.Trigger;
const Menu = Primitive.Root;

export { Menu, MenuItems, MenuItem, MenuTrigger };
