"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../utils/cn";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>): ReactNode {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-80 rounded-xl overflow-hidden border bg-fc-popover p-3 text-fc-popover-foreground shadow-md outline-none data-[state=open]:animate-fc-fadeIn data-[state=closed]:animate-fc-fadeOut origin-(--radix-popover-content-transform-origin)",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverTrigger, PopoverContent };
