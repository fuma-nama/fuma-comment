import * as Primitive from "@radix-ui/react-dialog";
import { cn } from "../utils/cn";

export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;

export function DialogContent({
  children,
  className,
  ...props
}: Primitive.DialogContentProps): JSX.Element {
  return (
    <Primitive.Portal>
      <Primitive.Overlay className="fc-fixed fc-inset-0 fc-bg-background/70 data-[state=open]:fc-animate-overlayShow" />
      <Primitive.Content
        className={cn(
          "fc-border fc-border-border fc-fixed fc-left-[50%] fc-top-[50%] fc-flex fc-w-full fc-max-w-md fc-translate-x-[-50%] fc-translate-y-[-50%] fc-flex-col fc-rounded-2xl fc-bg-popover fc-p-4 fc-shadow-lg data-[state=closed]:fc-animate-dialogHide data-[state=open]:fc-animate-dialogShow",
          className
        )}
        {...props}
      >
        {children}
      </Primitive.Content>
    </Primitive.Portal>
  );
}

export const DialogTitle = Primitive.Title;
