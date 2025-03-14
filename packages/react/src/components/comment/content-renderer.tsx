import type { JSONContent } from "@tiptap/react";
import { type ReactNode, useMemo, useState } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../utils/cn";
import { type StorageContext, useStorage } from "../../contexts/storage";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { CheckIcon, CopyIcon } from "lucide-react";
import { buttonVariants } from "../button";
import { lowlight } from "../../utils/highlighter";

interface Mark {
	type: string;
	attrs?: Record<string, unknown>;
	[key: string]: unknown;
}

type BaseRenderer = (props: {
	className: string;
	children: ReactNode;
}) => ReactNode;

export const mentionVariants = cva(
	"rounded-md bg-fc-primary/10 p-0.5 font-medium text-fc-primary",
);

export const codeVariants = cva(
	"rounded-sm border border-fc-border bg-fc-muted p-0.5",
);

export const codeBlockVariants = cva(
	"relative grid rounded-sm border border-fc-border bg-fc-muted p-2 text-sm my-1.5",
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
		className: "font-bold",
	},
	strike: {
		className: "line-through",
	},
	italic: {
		className: "italic",
	},
	code: {
		className: codeVariants(),
		element: () => (props) => <code {...props} />,
	},
	mention: {
		className: mentionVariants(),
	},
	link: {
		className: "font-medium underline",
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

let id = 0;

function renderText(content: JSONContent): ReactNode {
	let Element = defaultRenderer;
	const className: string[] = [];

	for (const mark of content.marks ?? []) {
		if (mark.type in marks) {
			const m = marks[mark.type];

			if (m.className) className.push(m.className);
			if (m.element) Element = m.element(mark);
		}
	}

	return (
		<Element key={id++} className={cn(className)}>
			{content.text}
		</Element>
	);
}

function render(content: JSONContent, storage: StorageContext): ReactNode {
	if (content.type === "text") {
		return renderText(content);
	}

	if (content.type === "codeBlock") {
		return (
			<CodeBlock
				key={id++}
				language={content.attrs?.language as string}
				content={content.content?.[0]?.text ?? ""}
			/>
		);
	}

	if (content.type === "image" && typeof content.attrs?.src === "string") {
		const attrs = content.attrs as {
			src: string;
			alt?: string;
			height: number;
			width: number;
		};

		if (typeof storage.render === "function") {
			return storage.render({
				...attrs,
				alt: attrs.alt ?? "uploaded image",
			});
		}

		const maxWidth = 600;
		const maxHeight = 400;
		let w = attrs.width;
		let h = attrs.height;

		if (w > maxWidth) {
			h = (maxWidth * h) / w;
			w = maxWidth;
		}

		if (h > maxHeight) {
			w = (maxHeight * w) / h;
			h = maxHeight;
		}

		return (
			<img
				key={id++}
				alt={attrs.alt}
				className="rounded-lg my-1.5"
				height={h}
				width={w}
				src={content.attrs.src}
			/>
		);
	}

	if (content.type === "mention") {
		const attrs = content.attrs as { id: string; label?: string };
		return (
			<span key={id++} className={cn(mentionVariants())}>
				@{attrs.label ?? attrs.id}
			</span>
		);
	}

	const joined: ReactNode[] = content.content?.map((child) =>
		render(child, storage),
	) ?? [" "];

	if (content.type === "paragraph") {
		return <span key={id++}>{joined}</span>;
	}

	if (content.type === "doc") {
		return (
			<div key={id++} className="grid whitespace-pre-wrap break-words">
				{joined}
			</div>
		);
	}
}

export function ContentRenderer({
	content,
}: {
	content: JSONContent;
}): ReactNode {
	const ctx = useStorage();

	return useMemo(() => render(content, ctx), [content, ctx]);
}

function CodeBlock({
	language,
	content,
}: { language: string; content: string }) {
	const tree = lowlight.highlight(
		lowlight.registered(language) ? language : "plaintext",
		content,
	);
	const [copied, setCopied] = useState(false);

	return (
		<pre className={cn(codeBlockVariants(), "p-0")}>
			<code className="overflow-auto p-2">
				{toJsxRuntime(tree, { Fragment, jsx, jsxs })}
			</code>
			<button
				type="button"
				className={cn(
					buttonVariants({
						size: "icon",
						variant: "secondary",
					}),
					"absolute right-0.5 top-0.5",
				)}
				onClick={() => {
					navigator.clipboard.writeText(content);
					setCopied(true);
					setTimeout(() => setCopied(false), 1000);
				}}
			>
				{copied ? (
					<CheckIcon className="size-3.5" />
				) : (
					<CopyIcon className="size-3.5" />
				)}
			</button>
		</pre>
	);
}
