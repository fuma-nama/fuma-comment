import * as Primitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../utils/cn";
import { buttonVariants } from "./button";

export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;
export const DialogDescription = Primitive.Description;

export function DialogContent({
	children,
	className,
	...props
}: Primitive.DialogContentProps): React.ReactElement {
	return (
		<Primitive.Portal>
			<Primitive.Overlay className="fixed inset-0 bg-black/50 z-10 data-[state=closed]:animate-overlayHide data-[state=open]:animate-overlayShow" />
			<Primitive.Content
				className={cn(
					"fixed left-1/2 top-1/2 flex w-full max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-fc-border bg-fc-popover text-fc-popover-foreground p-4 shadow-lg z-10 data-[state=closed]:animate-dialogHide data-[state=open]:animate-dialogShow",
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
