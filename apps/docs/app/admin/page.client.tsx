"use client";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/select";
import type { SummaryType } from "./page";

export function ModeSelect({ value }: { value: SummaryType }): ReactNode {
	const router = useRouter();
	return (
		<div className="mt-4 flex flex-row items-center gap-2">
			<label htmlFor="mode-select" className="text-sm font-medium">
				View By
			</label>
			<Select
				value={value}
				onValueChange={(v) => {
					const url = new URL(window.location.href);
					url.searchParams.set("summary_type", v);

					router.push(url.toString());
				}}
			>
				<SelectTrigger id="mode-select" className="w-[160px]">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="year">Year</SelectItem>
					<SelectItem value="month">Month</SelectItem>
					<SelectItem value="week">Week</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}
