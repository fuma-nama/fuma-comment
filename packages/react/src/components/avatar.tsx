import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

interface AvatarProps extends HTMLAttributes<HTMLElement> {
	image?: string | null;
	placeholder?: string;
}

export function Avatar({
	image,
	placeholder = "avatar",
	...props
}: AvatarProps): ReactNode {
	if (image) {
		return (
			<img
				src={image}
				alt={placeholder}
				{...props}
				className={cn(
					"size-8 select-none rounded-full bg-fc-muted",
					props.className,
				)}
				aria-label="avatar"
			/>
		);
	}

	return (
		<div
			{...props}
			aria-describedby={placeholder}
			className={cn(
				"size-8 rounded-full bg-gradient-to-br from-blue-600 to-red-600",
				props.className,
			)}
		/>
	);
}
