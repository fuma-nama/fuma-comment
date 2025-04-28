import * as Primitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../utils/cn";
import { buttonVariants } from "./button";
import { useIsMobile } from "../utils/use-media-query";
import { cva } from "class-variance-authority";
import {
	createContext,
	use,
	useEffect,
	useMemo,
	useState,
	type ComponentProps,
} from "react";

const Context = createContext<{
	open: boolean;
	setOpen: (v: boolean) => void;
} | null>(null);

export function Dialog(props: ComponentProps<typeof Primitive.Root>) {
	const [open, setOpen] =
		props.open !== undefined
			? [props.open, props.onOpenChange ?? (() => {})]
			: useState(false);

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

export const DialogTrigger = Primitive.Trigger;
export function DialogDescription({
	className,
	...props
}: Primitive.DialogDescriptionProps): React.ReactElement {
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
	"fixed inset-0 bg-black/50 data-[state=open]:animate-overlayShow data-[state=closed]:animate-overlayHide",
);

const sharedVariants = cva(
	"fixed left-1/2 flex w-full -translate-x-1/2 flex-col rounded-2xl bg-fc-popover text-fc-popover-foreground p-4 shadow-lg",
	{
		variants: {
			variant: {
				drawer:
					"bottom-0 rounded-b-none outline-none pb-6 transition-transform data-[state=closed]:animate-drawerHide data-[state=open]:animate-drawerShow",
				modal:
					"border border-fc-border max-w-md top-1/2 -translate-y-1/2 data-[state=closed]:animate-dialogHide data-[state=open]:animate-dialogShow",
			},
		},
	},
);

export function DialogContent({
	children,
	className,
	...props
}: Primitive.DialogContentProps): React.ReactElement {
	const { setOpen } = useContext();
	const isMobile = useIsMobile();
	const position = isMobile ? "bottom" : "center";
	const closeBn = (
		<Primitive.Close
			className={cn(
				buttonVariants({
					variant: "ghost",
					size: "icon",
					className: "absolute text-fc-muted-foreground right-3 top-3",
				}),
			)}
		>
			<X className="size-4" />
		</Primitive.Close>
	);

	const [offset, setOffset] = useState(0);
	const [pressing, setPressing] = useState(false);

	useEffect(() => {
		if (offset > 200) {
			setOpen(false);
			setPressing(false);
		}
	}, [offset, setOpen]);

	if (position === "bottom") {
		const onStopDrag = () => {
			if (!pressing) return;
			setOffset(0);
			setPressing(false);
		};

		return (
			<Primitive.Portal>
				<Primitive.Overlay className={overlayVariants()} />
				<Primitive.Content
					onPointerDown={() => {
						setPressing(true);
						window.addEventListener("touchend", onStopDrag, { once: true });
					}}
					onPointerMove={(e) => {
						if (!pressing || !(e.target instanceof HTMLElement)) return;
						let element = e.target;

						let shouldDrag = true;

						while (element) {
							if (element.getAttribute("role") === "dialog") {
								break;
							}

							if (
								element.scrollHeight > element.clientHeight &&
								element.scrollTop !== 0
							) {
								// The element is scrollable and not scrolled to the top, so don't drag
								shouldDrag = false;
								break;
							}

							// Move up to the parent element
							element = element.parentNode as HTMLElement;
						}

						if (!shouldDrag) return;
						setOffset((prev) => Math.max(0, prev + e.movementY));
						e.preventDefault();
					}}
					onAnimationEnd={() => {
						setOffset(0);
					}}
					onPointerLeave={onStopDrag}
					onPointerUp={onStopDrag}
					className={cn(sharedVariants({ variant: "drawer" }), className)}
					{...props}
					style={{
						...props.style,
						transition: pressing ? "none" : props.style?.transition,
						transform: `translateY(${offset}px)`,
					}}
				>
					{children}
					{closeBn}
				</Primitive.Content>
			</Primitive.Portal>
		);
	}

	return (
		<Primitive.Portal>
			<Primitive.Overlay className={overlayVariants()} />
			<Primitive.Content
				data-position={position}
				className={cn(sharedVariants({ variant: "modal" }), className)}
				{...props}
			>
				{children}
				{closeBn}
			</Primitive.Content>
		</Primitive.Portal>
	);
}

export function DialogTitle({
	className,
	...props
}: Primitive.DialogTitleProps): React.ReactElement {
	return (
		<Primitive.Title
			className={cn("mb-2 font-medium max-sm:text-center", className)}
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
