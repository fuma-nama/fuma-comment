"use client";
import { useLayoutEffect, useState } from "react";
import { toLocalString } from "../utils/date";

export function Timestamp({
  timestamp,
}: {
  timestamp: Date | string;
}): React.ReactNode {
  const [str, setStr] = useState("");

  useLayoutEffect(() => {
    setStr(toLocalString(new Date(timestamp)));
  }, [timestamp]);

  return str;
}
