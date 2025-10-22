import * as Primitive from "@radix-ui/react-dialog";
import { cva } from "class-variance-authority";
import { X } from "lucide-react";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  use,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "../utils/cn";
import { useIsMobile } from "../utils/use-media-query";
import { buttonVariants } from "./button";

const Context = createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
} | null>(null);

function Dialog(props: ComponentProps<typeof Primitive.Root>) {
  const _state = useState(false);
  const [open, setOpen] =
    props.open !== undefined
      ? [props.open, props.onOpenChange ?? (() => {})]
      : _state;

  return (
    <Primitive.Root {...props} open={open} onOpenChange={setOpen}>
      <Context.Provider
        value={useMemo(
          () => ({
            open,
            setOpen,
          }),
          [open, setOpen],
        )}
      >
        {props.children}
      </Context.Provider>
    </Primitive.Root>
  );
}

const DialogTrigger = Primitive.Trigger;

function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof Primitive.Description>): ReactNode {
  return (
    <Primitive.Description
      className={cn(
        "text-fc-muted-foreground text-sm mb-4 max-sm:text-center",
        className,
      )}
      {...props}
    />
  );
}

const overlayVariants = cva(
  "fixed inset-0 bg-black/50 data-[state=open]:animate-fc-overlayShow data-[state=closed]:animate-fc-overlayHide",
);

const contentVariants = cva(
  "fixed left-1/2 flex w-full -translate-x-1/2 flex-col bg-fc-popover text-fc-popover-foreground shadow-lg overflow-hidden",
  {
    variants: {
      full: {
        true: "p-0",
        false: "p-4",
      },
      variant: {
        drawer:
          "rounded-t-3xl outline-none pt-2 pb-10 transition-transform data-[state=closed]:animate-fc-drawerHide data-[state=open]:animate-fc-drawerShow",
        modal:
          "rounded-2xl border border-fc-border max-w-md top-1/2 -translate-y-1/2 data-[state=closed]:animate-fc-dialogHide data-[state=open]:animate-fc-dialogShow",
      },
    },
  },
);

interface DialogProps extends ComponentProps<typeof Primitive.Content> {
  full?: boolean;
}

function DialogContent(props: DialogProps): ReactNode {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <DrawerContent {...props} />;
  }

  const { children, full = false, className, ...rest } = props;
  return (
    <Primitive.Portal>
      <Primitive.Overlay className={overlayVariants()} />
      <Primitive.Content
        className={cn(contentVariants({ variant: "modal", full, className }))}
        {...rest}
      >
        {children}
        <Primitive.Close
          className={cn(
            buttonVariants({
              variant: "ghost",
              size: "icon",
              className: "absolute text-fc-muted-foreground right-3.5 top-3.5",
            }),
          )}
        >
          <X className="size-4" />
        </Primitive.Close>
      </Primitive.Content>
    </Primitive.Portal>
  );
}

function DrawerContent({
  full = false,
  children,
  className,
  ...props
}: DialogProps) {
  const bottomPadding = 20;
  const contentRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLElement>(null);
  const offsetRef = useRef(0);
  const lastMovementRef = useRef(0);
  const [pressing, setPressing] = useState(false);
  const { setOpen } = useContext();

  function setOffset(v: number) {
    offsetRef.current = v;
    const element = contentRef.current;
    if (element) {
      element.style.setProperty("--drawer-offset", `${offsetRef.current}px`);
    }
  }

  // with reference to https://github.com/emilkowalski/vaul/blob/main/src/index.tsx
  function shouldDrag(target: HTMLElement, movement: number): boolean {
    if (target.isContentEditable) return false;

    const highlightedText = window.getSelection()?.toString();
    if (highlightedText && highlightedText.length > 0) {
      return false;
    }

    if (target.tagName === "SELECT" || target.tagName === "INPUT") {
      return false;
    }

    let element = target;
    while (element) {
      if (element.getAttribute("role") === "dialog") break;

      if (
        element.scrollHeight > element.clientHeight &&
        (element.scrollTop > 0 || movement < 0)
      ) {
        return false;
      }

      // Move up to the parent element
      element = element.parentNode as HTMLElement;
    }

    return true;
  }

  function onStopDrag() {
    if (!pressing) return;
    setOffset(0);
    setPressing(false);
  }

  return (
    <Primitive.Portal>
      <Primitive.Overlay className={overlayVariants()} />
      <Primitive.Content
        data-fc-drawer
        ref={contentRef}
        onPointerDown={(e) => {
          if (
            !(e.target instanceof HTMLElement) ||
            !shouldDrag(e.target, e.movementY)
          )
            return;

          setPressing(true);
          targetRef.current = e.target;
          lastMovementRef.current = 0;
          window.addEventListener("touchend", onStopDrag, { once: true });
        }}
        onPointerMove={(e) => {
          if (
            !pressing ||
            !targetRef.current ||
            !shouldDrag(targetRef.current, e.movementY)
          )
            return;

          const newOffset = Math.max(
            -bottomPadding,
            offsetRef.current + e.movementY,
          );
          lastMovementRef.current = e.movementY;
          setOffset(newOffset);
          e.preventDefault();
        }}
        onAnimationEnd={() => {
          setOffset(0);
        }}
        onPointerLeave={onStopDrag}
        onPointerUp={() => {
          if (
            (contentRef.current &&
              offsetRef.current > contentRef.current.clientHeight / 3) ||
            lastMovementRef.current > 15
          ) {
            setOpen(false);
            setPressing(false);
          } else {
            onStopDrag();
          }
        }}
        className={cn(
          contentVariants({
            variant: "drawer",
            full,
            className,
          }),
        )}
        {...props}
        style={{
          ...props.style,
          bottom: -bottomPadding,
          transition: pressing ? "none" : props.style?.transition,
          transform: "translateY(var(--drawer-offset))",
        }}
      >
        {!full && (
          <div className="z-2 mb-3 mx-auto w-12 h-1 rounded-full bg-fc-primary/30" />
        )}
        {children}
      </Primitive.Content>
    </Primitive.Portal>
  );
}

function DialogTitle({
  className,
  ...props
}: ComponentProps<typeof Primitive.Title>): ReactNode {
  return (
    <Primitive.Title
      className={cn("mb-2 font-semibold max-sm:text-center", className)}
      {...props}
    >
      {props.children}
    </Primitive.Title>
  );
}

function useContext() {
  const ctx = use(Context);
  if (!ctx) throw new Error("Root missing");
  return ctx;
}

export { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription };
