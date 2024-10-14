import { eachDayOfInterval, eachMonthOfInterval, formatDate } from "date-fns";
import type { ReactNode } from "react";
import { z } from "zod";
import { prisma } from "@/utils/database";
import { Chart } from "./chart";
import { ModeSelect } from "./page.client";

/**
 * len of day in ms
 */
const DAY_LEN = 1000 * 60 * 60 * 24;
const MONTH_LEN = DAY_LEN * 30;
const types = z.enum(["year", "month", "week"]);

type Per = "month" | "day";
export type SummaryType = z.infer<typeof types>;

export default async function Page({
  searchParams,
}: {
  searchParams: { summary_type?: "year" | "month" };
}): Promise<ReactNode> {
  const type = types.parse(searchParams.summary_type ?? "month");
  const per: Per = type === "year" ? "month" : "day";

  const start = new Date(Date.now());
  if (type === "year") {
    start.setMonth(start.getMonth() - 12);
  } else if (type === "month") {
    start.setMonth(start.getMonth() - 1);
  } else {
    start.setDate(start.getDate() - 7);
  }

  const result = await prisma.comment.findMany({
    where: {
      timestamp: {
        gte: start,
      },
    },
  });

  const now = new Date(Date.now());
  const unit = per === "month" ? MONTH_LEN : DAY_LEN;
  const items =
    per === "month"
      ? eachMonthOfInterval({
          start,
          end: now,
        })
      : eachDayOfInterval({ start, end: now });

  const data: { count: number; time: string }[] = items.map((item) => ({
    count: 0,
    time: formatDate(item, "dd MMM yyyy"),
  }));

  for (const item of result) {
    const i = Math.floor(
      (item.timestamp.getTime() - start.getTime()) / unit + 0.5
    );

    data[i].count++;
  }

  return (
    <main className="container">
      <div className="rounded-lg border bg-card p-6 text-card-foreground">
        <h2 className="mb-2 font-medium">
          Comments of This{" "}
          {
            {
              year: "Year",
              month: "Month",
              week: "Week",
            }[type]
          }
        </h2>
        <p className="mb-4 text-sm text-fc-muted-foreground">
          From {start.toDateString()} to {now.toDateString()}.
        </p>
        <Chart data={data} />
        <ModeSelect value={type} />
      </div>
    </main>
  );
}
