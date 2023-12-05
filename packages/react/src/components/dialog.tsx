import * as Primitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { cn } from "../utils/cn";
import { buttonVariants } from "./button";

export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;

export function DialogContent({
  children,
  className,
  ...props
}: Primitive.DialogContentProps): JSX.Element {
  return (
    <Primitive.Portal>
      <Primitive.Overlay className="fc-fixed fc-inset-0 fc-bg-background/70 rtx-state-closed:fc-animate-overlayHide rtx-state-open:fc-animate-overlayShow" />
      <Primitive.Content
        className={cn(
          "fc-fixed fc-left-[50%] fc-top-[50%] fc-flex fc-w-full fc-max-w-md fc-translate-x-[-50%] fc-translate-y-[-50%] fc-flex-col fc-rounded-2xl fc-border fc-border-border fc-bg-popover fc-p-4 fc-shadow-lg rtx-state-closed:fc-animate-dialogHide rtx-state-open:fc-animate-dialogShow",
          className
        )}
        {...props}
      >
        {children}
        <Primitive.Close
          className={cn(
            buttonVariants({
              variant: "ghost",
              size: "icon",
              className: "fc-absolute fc-right-3 fc-top-3",
            })
          )}
        >
          <XIcon className="fc-h-4 fc-w-4" />
        </Primitive.Close>
      </Primitive.Content>
    </Primitive.Portal>
  );
}

export function DialogTitle({
  className,
  ...props
}: Primitive.DialogTitleProps): JSX.Element {
  return (
    <Primitive.Title
      className={cn("fc-mb-2 fc-font-semibold", className)}
      {...props}
    >
      {props.children}
    </Primitive.Title>
  );
}
