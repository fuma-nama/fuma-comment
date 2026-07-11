import { cn } from "@/utils/cn";
import type { ComponentProps, ReactNode } from "react";

interface MarqueeProps extends ComponentProps<"div"> {
	className?: string;
	reverse?: boolean;
	pauseOnHover?: boolean;
	children: ReactNode;
	vertical?: boolean;
	repeat?: number;
}

export function Marquee({
	className,
	reverse = false,
	pauseOnHover = false,
	children,
	vertical = false,
	repeat = 4,
	...props
}: MarqueeProps) {
	return (
		<div
			{...props}
			className={cn(
				"group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]",
				vertical ? "flex-col" : "flex-row",
				className,
			)}
		>
			{Array(repeat)
				.fill(0)
				.map((_, i) => (
					<div
						key={i}
						className={cn(
							"flex shrink-0 justify-around [gap:var(--gap)]",
							vertical ? "animate-marquee-vertical flex-col" : "animate-marquee flex-row",
							pauseOnHover && "group-hover:[animation-play-state:paused]",
							reverse && "[animation-direction:reverse]",
						)}
					>
						{children}
					</div>
				))}
		</div>
	);
}
