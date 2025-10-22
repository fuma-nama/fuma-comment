"use client";

import { type ReactNode, useLayoutEffect, useState } from "react";
import { toLocalString } from "../utils/date";

function Timestamp({ timestamp }: { timestamp: Date | string }): ReactNode {
  const [str, setStr] = useState("");

  useLayoutEffect(() => {
    setStr(toLocalString(new Date(timestamp)));
  }, [timestamp]);

  return str;
}

export { Timestamp };
