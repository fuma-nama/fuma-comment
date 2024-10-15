import { eachDayOfInterval, eachMonthOfInterval, formatDate } from "date-fns";
import type { ReactElement, ReactNode } from "react";
import { z } from "zod";
import { ContentRenderer } from "@fuma-comment/react/atom";
import { prisma } from "@/utils/database";
import { cva } from "@/utils/cva";
import { adapter } from "../api/comments/[...comment]/route";
import { Chart } from "./chart";
import { ModeSelect } from "./page.client";
import { SmartDate } from "./smart-date";

const cardVariants = cva({
  base: "rounded-lg border bg-card p-4 text-card-foreground shadow-md",
});

/**
 * len of day in ms
 */
const DAY_LEN = 1000 * 60 * 60 * 24;
const MONTH_LEN = DAY_LEN * 30;
const types = z.enum(["year", "month", "week"]);

type Per = "month" | "day";
export type SummaryType = z.infer<typeof types>;

export default function Page({
  searchParams,
}: {
  searchParams: { summary_type?: "year" | "month" };
}): ReactNode {
  const type = types.parse(searchParams.summary_type ?? "month");

  return (
    <>
      <Summary type={type} />
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className={cardVariants()}>
          <h2 className="mb-2 font-medium">Latest Comments</h2>
          <LatestComments />
        </div>
        <div className={cardVariants()}>
          <h2 className="mb-2 font-medium">Members</h2>
        </div>
      </div>
    </>
  );
}

async function LatestComments(): Promise<ReactElement> {
  const result = await adapter.getComments({
    limit: 15,
    sort: "newest",
  });

  return (
    <ul className="-mx-2 flex max-h-[400px] flex-col gap-2 overflow-auto">
      {result.map((item) => (
        <li key={item.id} className="bg-fc-muted p-2 text-sm">
          <p className="mb-1 text-xs font-medium">{item.author.name}</p>
          <div className="text-fc-foreground/80">
            <ContentRenderer content={item.content} />
          </div>
          <SmartDate
            className="group pt-4 text-xs text-fc-muted-foreground transition-colors data-[relative=true]:text-fc-primary"
            date={item.timestamp}
          />
        </li>
      ))}
    </ul>
  );
}

async function Summary({ type }: { type: SummaryType }): Promise<ReactElement> {
  const per: Per = type === "year" ? "month" : "day";

  const now = new Date(Date.now());
  const start = new Date(Date.now());
  if (type === "year") {
    start.setMonth(start.getMonth() - 12);
  } else if (type === "month") {
    start.setDate(start.getDate() - 30);
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
    time: formatDate(item, "dd MMM"),
  }));

  for (const item of result) {
    const i = Math.floor(
      (item.timestamp.getTime() - start.getTime()) / unit + 0.5
    );

    data[i].count++;
  }

  return (
    <div className={cardVariants()}>
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
  );
}
