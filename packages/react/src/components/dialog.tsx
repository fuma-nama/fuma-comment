import * as Primitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../utils/cn";
import { buttonVariants } from "./button";
import { useIsMobile } from "../utils/use-media-query";

export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;
export function DialogDescription({
	className,
	...props
}: Primitive.DialogDescriptionProps): React.ReactElement {
	return (
		<Primitive.Description
			className={cn("text-fc-muted-foreground text-sm mb-4", className)}
			{...props}
		/>
	);
}

export function DialogContent({
	children,
	className,
	...props
}: Primitive.DialogContentProps): React.ReactElement {
	const isMobile = useIsMobile();
	const position = isMobile ? "bottom" : "center";

	return (
		<Primitive.Portal>
			<Primitive.Overlay className="fixed inset-0 bg-black/50 z-10 data-[state=closed]:animate-overlayHide data-[state=open]:animate-overlayShow" />
			<Primitive.Content
				data-position={position}
				className={cn(
					"fixed left-1/2 flex w-full max-w-md -translate-x-1/2 flex-col rounded-2xl border border-fc-border bg-fc-popover text-fc-popover-foreground p-4 shadow-lg z-10",
					position === "bottom"
						? "bottom-0 rounded-b-none border-b-0 pb-8 data-[state=closed]:animate-dialogHideBottom data-[state=open]:animate-dialogShowBottom"
						: "top-1/2 -translate-y-1/2 data-[state=closed]:animate-dialogHide data-[state=open]:animate-dialogShow",
					className,
				)}
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
		</Primitive.Portal>
	);
}

export function DialogTitle({
	className,
	...props
}: Primitive.DialogTitleProps): React.ReactElement {
	return (
		<Primitive.Title className={cn("mb-2 font-semibold", className)} {...props}>
			{props.children}
		</Primitive.Title>
	);
}
