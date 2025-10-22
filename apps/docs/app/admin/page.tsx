import { CommentsList, CommentsProvider } from "@fuma-comment/react/atom";
import { eachDayOfInterval, eachMonthOfInterval, formatDate } from "date-fns";
import { getServerSession } from "next-auth";
import type { ReactElement, ReactNode } from "react";
import { z } from "zod";
import { cva } from "@/utils/cva";
import { prisma } from "@/utils/database";
import { authOptions } from "../api/auth/[...nextauth]/options";
import { Chart } from "./chart";
import { ModeSelect } from "./page.client";

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

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ summary_type?: "year" | "month" }>;
}): Promise<ReactElement> {
  const type = types.parse((await searchParams).summary_type ?? "month");
  const session = await getServerSession(authOptions);

  return (
    <CommentsProvider
      page="default"
      auth={{
        type: "ssr",
        session: session?.user?.id
          ? {
              id: session.user.id,
              permissions: {
                delete: true,
              },
            }
          : null,
        signIn: null,
      }}
    >
      <Summary type={type} />
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={cardVariants()}>
          <h2 className="mb-2 font-medium">Latest Comments</h2>
          <LatestComments />
        </div>
        <div className={cardVariants()}>
          <h2 className="mb-2 font-medium">Moderation</h2>
        </div>
      </div>
    </CommentsProvider>
  );
}

function LatestComments(): ReactNode {
  return (
    <CommentsList className="-mx-2 flex max-h-[400px] flex-col gap-2 overflow-auto" />
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
      (item.timestamp.getTime() - start.getTime()) / unit + 0.5,
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
