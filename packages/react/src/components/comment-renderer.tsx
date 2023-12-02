import type { JSONContent } from "@tiptap/react";
import type { ReactNode } from "react";
import { cva } from "cva";
import { cn } from "../utils/cn";

interface Mark {
  type: string;
  attrs?: Record<string, unknown>;
  [key: string]: unknown;
}

type BaseRenderer = (props: {
  className: string;
  children: ReactNode;
}) => JSX.Element;

export const codeVariants = cva(
  "fc-rounded-sm fc-border fc-border-border fc-bg-muted fc-p-0.5"
);

const defaultRenderer: BaseRenderer = (props) => <span {...props} />;

type Marks = Record<
  string,
  {
    element?: (mark: Mark) => BaseRenderer;
    className?: string;
  }
>;

const marks: Marks = {
  bold: {
    className: "fc-font-bold",
  },

  strike: {
    className: "fc-line-through",
  },
  italic: {
    className: "fc-italic",
  },
  code: {
    className: codeVariants(),
    element: () => (props) => <code {...props} />,
  },
  link: {
    className: "fc-font-medium fc-underline",
    element(mark) {
      const href = mark.attrs?.href;
      if (typeof href === "string")
        return function Link(props) {
          return (
            <a href={href} rel="noreferrer noopener" {...props}>
              {props.children}
            </a>
          );
        };

      return defaultRenderer;
    },
  },
};
function renderText(content: JSONContent): JSX.Element {
  let getElement = defaultRenderer;
  const className: string[] = [];

  for (const mark of content.marks ?? []) {
    if (mark.type in marks) {
      const m = marks[mark.type];

      if (m.className) className.push(m.className);
      if (m.element) getElement = m.element(mark);
    }
  }

  return getElement({ className: cn(className), children: content.text });
}

export function ContentRenderer({
  content,
}: {
  content: JSONContent;
}): JSX.Element {
  if (content.type === "text") {
    return renderText(content);
  }

  const joined: ReactNode[] = content.content?.map((child, i) => (
    // eslint-disable-next-line react/no-array-index-key -- Won't re-render
    <ContentRenderer content={child} key={i} />
  )) ?? [" "];

  if (content.type === "paragraph") {
    return <span>{joined}</span>;
  }

  if (content.type === "doc") {
    return (
      <div className="fc-grid fc-whitespace-pre-wrap fc-break-words">
        {joined}
      </div>
    );
  }

  return <>{joined}</>;
}
