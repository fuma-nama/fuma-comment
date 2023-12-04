import type { Content } from "./types";

type Serializers = Record<
  string,
  (content: Content, children: string) => string
>;

const defaultSerializers: Serializers = {
  text: (content) => {
    return content.text ?? "";
  },
  paragraph: (_, child) => {
    return `${child}\n`;
  },
};

export function getTextFromContent(
  content: Content,
  customSerializer?: Serializers
): string {
  const serializers = { ...defaultSerializers, ...customSerializer };
  const child = (
    content.content?.map((c) => getTextFromContent(c, customSerializer)) ?? []
  )
    .join("")
    .trimEnd();

  if (content.type in serializers)
    return serializers[content.type](content, child);
  return child;
}
