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

export function Chart({ data }: { data: any[] }): ReactNode {
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
					fill="hsl(var(--fc-primary))"
					radius={[8, 8, 0, 0]}
				/>
				<XAxis
					dataKey="time"
					fontSize={13}
					stroke="hsl(var(--fc-muted-foreground))"
				/>
				<YAxis
					allowDecimals={false}
					stroke="hsl(var(--fc-muted-foreground))"
					width={24}
					fontSize={13}
				/>
				<Tooltip
					cursor={{ fill: "hsl(var(--fc-primary)/0.1)" }}
					contentStyle={{
						backgroundColor: "hsl(var(--fc-popover))",
						border: "1px solid hsl(var(--fc-border))",
						borderRadius: "8px",
						fontSize: "14px",
						color: "hsl(var(--fc-popover-foreground))",
					}}
				/>
			</BarChart>
		</ResponsiveContainer>
	);
}
