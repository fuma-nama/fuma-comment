"use client";
import type { ReactNode } from "react";
import {
	Bar,
	BarChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

export function Chart({ data }: { data: unknown[] }): ReactNode {
	return (
		<ResponsiveContainer className="min-h-[400px] w-full">
			<BarChart
				width={400}
				height={400}
				data={data}
				margin={{ top: 0, right: 4, left: 0, bottom: 0 }}
			>
				<Bar
					type="monotone"
					dataKey="count"
					fill="var(--color-fc-primary)"
					radius={[8, 8, 0, 0]}
				/>
				<XAxis
					dataKey="time"
					fontSize={13}
					stroke="var(--color-fc-muted-foreground)"
				/>
				<YAxis
					allowDecimals={false}
					stroke="var(--color-fc-muted-foreground)"
					width={24}
					fontSize={13}
				/>
				<Tooltip
					cursor={{
						fill: "color-mix(in oklab, var(--color-fc-primary) 10%, transparent)",
					}}
					contentStyle={{
						backgroundColor: "var(--color-fc-popover)",
						border: "1px solid var(--color-fc-border)",
						borderRadius: "8px",
						fontSize: "14px",
						color: "var(--color-fc-popover-foreground)",
					}}
				/>
			</BarChart>
		</ResponsiveContainer>
	);
}
