"use client";
import { formatDate } from "date-fns/format";
import { formatRelative } from "date-fns/formatRelative";
import { type ButtonHTMLAttributes, useState, type ReactNode } from "react";

export function SmartDate({
  date,
  ...props
}: { date: Date } & ButtonHTMLAttributes<HTMLButtonElement>): ReactNode {
  const [relative, setRelative] = useState(false);

  return (
    <button
      type="button"
      {...props}
      data-relative={relative}
      onMouseDown={() => {
        setRelative((prev) => !prev);
      }}
    >
      {relative ? formatRelative(date, Date.now()) : formatDate(date, "p, PP")}
    </button>
  );
}
