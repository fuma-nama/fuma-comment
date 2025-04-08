import * as Primitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../utils/cn";
import { buttonVariants } from "./button";
import { useIsMobile } from "../utils/use-media-query";
import { Drawer } from "vaul";
import { cva } from "class-variance-authority";
import type { ComponentProps } from "react";

export function Dialog(props: ComponentProps<typeof Drawer.Root>) {
	return (
		<Drawer.Root repositionInputs={false} disablePreventScroll {...props}>
			{props.children}
		</Drawer.Root>
	);
}

export const DialogTrigger = Drawer.Trigger;
export function DialogDescription({
	className,
	...props
}: Primitive.DialogDescriptionProps): React.ReactElement {
	return (
		<Drawer.Description
			className={cn("text-fc-muted-foreground text-sm mb-4", className)}
			{...props}
		/>
	);
}

const sharedVariants = cva(
	"fixed left-1/2 flex w-full max-w-md -translate-x-1/2 flex-col rounded-2xl bg-fc-popover text-fc-popover-foreground p-4 shadow-lg",
	{
		variants: {
			variant: {
				drawer: "bottom-0 rounded-b-none outline-none",
				modal:
					"border border-fc-border top-1/2 -translate-y-1/2 data-[state=closed]:animate-dialogHide data-[state=open]:animate-dialogShow",
			},
		},
	},
);

export function DialogContent({
	children,
	className,
	...props
}: Primitive.DialogContentProps): React.ReactElement {
	const isMobile = useIsMobile();
	const position = isMobile ? "bottom" : "center";

	if (position === "bottom") {
		return (
			<Drawer.Portal>
				<Drawer.Overlay className="fixed inset-0 bg-black/40" />
				<Drawer.Content
					className={cn(sharedVariants({ variant: "drawer" }), className)}
					{...props}
				>
					{children}
				</Drawer.Content>
			</Drawer.Portal>
		);
	}

	return (
		<Drawer.Portal>
			<Drawer.Overlay className="fixed inset-0 bg-black/40" />
			<Primitive.Content
				data-position={position}
				className={cn(sharedVariants({ variant: "modal" }), className)}
				{...props}
			>
				{children}
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
			</Primitive.Content>
		</Drawer.Portal>
	);
}

export function DialogTitle({
	className,
	...props
}: Primitive.DialogTitleProps): React.ReactElement {
	return (
		<Drawer.Title className={cn("mb-2 font-semibold", className)} {...props}>
			{props.children}
		</Drawer.Title>
	);
}
