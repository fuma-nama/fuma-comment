"use client";
import { useLayoutEffect, useState } from "react";
import { toLocalString } from "../utils/date";
import { useTranslations } from "@fuma-translate/react";

export function Timestamp({ timestamp }: { timestamp: Date | string }): React.ReactNode {
	const t = useTranslations({ note: "timestamp" });
	const [str, setStr] = useState("");

	useLayoutEffect(() => {
		setStr(toLocalString(new Date(timestamp), t("Today")));
	}, [t, timestamp]);

	return str;
}
