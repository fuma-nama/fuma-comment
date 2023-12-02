import type { Content } from "./types";

export function getTextFromContent(content: Content): string {
  if (content.type === "text") return content.text ?? "";
  const child = (content.content?.map((c) => getTextFromContent(c)) ?? [])
    .join("")
    .trimEnd();

  if (content.type === "paragraph") return `${child}\n`;
  return child;
}
