import { marked, type Token, type Tokens } from "marked";

export interface JSONContent {
	type?: string;
	text?: string;
	marks?: { type: string; attrs?: Record<string, unknown> }[];
	attrs?: Record<string, unknown>;
	content?: JSONContent[];
}

// ── editor doc -> GitHub Markdown ────────────────────────────────────────────────────────────────

function longestRun(text: string, char: string): number {
	let max = 0;
	let run = 0;
	for (const c of text) {
		run = c === char ? run + 1 : 0;
		if (run > max) max = run;
	}
	return max;
}

function escapeInline(text: string): string {
	return text.replace(/[\\`*_~[\]<&]/g, "\\$&");
}

/** Block markers only take effect at the start of a line. */
function escapeBlockStart(text: string): string {
	return text
		.replace(/(^|\n)(\s*)([#>+-])/g, "$1$2\\$3")
		.replace(/(^|\n)(\s*\d+)([.)])/g, "$1$2\\$3");
}

function escapeAttr(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function decodeAttr(value: string): string {
	return value
		.replace(/&quot;/g, '"')
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&amp;/g, "&");
}

function destination(href: string): string {
	if (!/[\s()<>]/.test(href)) return href;
	return `<${href.replace(/[<>]/g, encodeURIComponent)}>`;
}

function codeSpan(text: string): string {
	const fence = "`".repeat(longestRun(text, "`") + 1);
	const pad = text.startsWith("`") || text.endsWith("`") ? " " : "";
	return fence + pad + text + pad + fence;
}

/** Markdown image syntax cannot carry the width/height the editor requires, so sized images go out as HTML. */
function imageToMarkdown(attrs: Record<string, unknown> = {}): string {
	const { src, alt, width, height } = attrs;
	if (typeof src !== "string" || !src) return "";
	const text = typeof alt === "string" ? alt : "";
	if (typeof width !== "number" || typeof height !== "number") {
		return `![${escapeInline(text)}](${destination(src)})`;
	}
	return `<img src="${escapeAttr(src)}" alt="${escapeAttr(text)}" width="${width}" height="${height}">`;
}

function inlineToMarkdown(node: JSONContent): string {
	if (node.type === "text") {
		const marks = node.marks ?? [];
		const has = (type: string) => marks.some((mark) => mark.type === type);
		if (has("code")) return codeSpan(node.text ?? "");

		let text = escapeInline(node.text ?? "");
		if (has("bold")) text = `**${text}**`;
		if (has("italic")) text = `_${text}_`;
		if (has("strike")) text = `~~${text}~~`;
		const href = marks.find((mark) => mark.type === "link")?.attrs?.href;
		if (typeof href === "string" && href) text = `[${text}](${destination(href)})`;
		return text;
	}
	// A mention's `id` is the GitHub login, which is what GitHub links (not the display label).
	if (node.type === "mention") {
		const { id, label } = node.attrs ?? {};
		const login = typeof id === "string" ? id : typeof label === "string" ? label : "";
		return login ? `@${login}` : "";
	}
	if (node.type === "image") return imageToMarkdown(node.attrs);
	return joinInline(node.content);
}

function joinInline(nodes: JSONContent[] | undefined): string {
	let out = "";
	for (const node of nodes ?? []) out += inlineToMarkdown(node);
	return out;
}

function joinBlocks(nodes: JSONContent[] | undefined): string {
	let out = "";
	for (const node of nodes ?? []) {
		const markdown = blockToMarkdown(node);
		if (!markdown.trim()) continue;
		if (out) out += "\n\n";
		out += markdown;
	}
	return out;
}

function blockToMarkdown(node: JSONContent): string {
	switch (node.type) {
		case "paragraph":
			return escapeBlockStart(joinInline(node.content));
		case "codeBlock": {
			let code = "";
			for (const child of node.content ?? []) code += child.text ?? "";
			const lang = node.attrs?.language;
			const fence = "`".repeat(Math.max(3, longestRun(code, "`") + 1));
			return `${fence}${typeof lang === "string" ? lang : ""}\n${code}\n${fence}`;
		}
		case "image":
			return imageToMarkdown(node.attrs);
		default:
			return joinBlocks(node.content);
	}
}

/** Serialize the editor's content (a tiptap doc) to GitHub-flavored Markdown. */
export function contentToMarkdown(doc: JSONContent | undefined): string {
	if (doc?.type !== "doc") return "";
	return joinBlocks(doc.content);
}

// ── GitHub Markdown -> editor doc ────────────────────────────────────────────────────────────────

function textNode(text: string, marks?: JSONContent["marks"]): JSONContent {
	return marks?.length ? { type: "text", text, marks } : { type: "text", text };
}

/** ProseMirror rejects empty text nodes, so every text push goes through here. */
function pushText(out: JSONContent[], text: string, marks?: JSONContent["marks"]): void {
	if (text) out.push(textNode(text, marks));
}

function withMark(
	nodes: JSONContent[],
	mark: { type: string; attrs?: Record<string, unknown> },
): JSONContent[] {
	for (const node of nodes) {
		if (node.type === "text") node.marks = [...(node.marks ?? []), mark];
	}
	return nodes;
}

// A GitHub @mention: preceded by start/whitespace/"(" (so emails like a@b don't match), a valid-ish login.
const MENTION_RE = /(?<=^|[\s(])@([a-zA-Z\d](?:-?[a-zA-Z\d]){0,38})/g;

function pushMentions(out: JSONContent[], value: string): void {
	let last = 0;
	for (const match of value.matchAll(MENTION_RE)) {
		pushText(out, value.slice(last, match.index));
		out.push({ type: "mention", attrs: { id: match[1], label: match[1] } });
		last = match.index + match[0].length;
	}
	pushText(out, value.slice(last));
}

const IMG_RE = /^<img\b([^>]*)>$/i;
const ATTR_RE = /([a-z]+)\s*=\s*"([^"]*)"/gi;

function parseImage(html: string): JSONContent | null {
	const tag = IMG_RE.exec(html.trim());
	if (!tag) return null;

	let src = "";
	let alt = "";
	let width = Number.NaN;
	let height = Number.NaN;
	for (const [, name, value] of tag[1].matchAll(ATTR_RE)) {
		switch (name.toLowerCase()) {
			case "src":
				src = decodeAttr(value);
				break;
			case "alt":
				alt = decodeAttr(value);
				break;
			case "width":
				width = Number(value);
				break;
			case "height":
				height = Number(value);
				break;
		}
	}
	if (!src || !Number.isFinite(width) || !Number.isFinite(height)) return null;
	return { type: "image", attrs: { src, alt, width, height } };
}

function stripTags(html: string): string {
	return html.replace(/<[^>]*>/g, "");
}

function pushHtml(out: JSONContent[], html: string): void {
	const image = parseImage(html);
	if (image) out.push(image);
	else pushText(out, stripTags(html));
}

function inlineFromTokens(tokens: Token[] | undefined): JSONContent[] {
	const out: JSONContent[] = [];
	for (const token of tokens ?? []) {
		switch (token.type) {
			case "text": {
				const text = token as Tokens.Text;
				if (text.tokens?.length) out.push(...inlineFromTokens(text.tokens));
				else pushMentions(out, text.text);
				break;
			}
			case "escape":
				pushText(out, (token as Tokens.Escape).text);
				break;
			case "strong":
				out.push(...withMark(inlineFromTokens((token as Tokens.Strong).tokens), { type: "bold" }));
				break;
			case "em":
				out.push(...withMark(inlineFromTokens((token as Tokens.Em).tokens), { type: "italic" }));
				break;
			case "del":
				out.push(...withMark(inlineFromTokens((token as Tokens.Del).tokens), { type: "strike" }));
				break;
			case "codespan":
				pushText(out, (token as Tokens.Codespan).text, [{ type: "code" }]);
				break;
			case "link": {
				const link = token as Tokens.Link;
				out.push(
					...withMark(inlineFromTokens(link.tokens), { type: "link", attrs: { href: link.href } }),
				);
				break;
			}
			// Without dimensions the editor cannot hold an image node, so bare Markdown images become links.
			case "image": {
				const image = token as Tokens.Image;
				const label = image.text || image.href;
				if (label) {
					out.push(...withMark([textNode(label)], { type: "link", attrs: { href: image.href } }));
				}
				break;
			}
			// The editor has no hard-break node; the renderer preserves newlines instead.
			case "br":
				pushText(out, "\n");
				break;
			case "html":
				pushHtml(out, (token as Tokens.HTML).text);
				break;
			default:
				pushText(out, (token as { raw?: string }).raw ?? "");
		}
	}
	return out;
}

function blocksFromTokens(tokens: Token[]): JSONContent[] {
	const out: JSONContent[] = [];
	const pushParagraph = (content: JSONContent[]) => {
		if (content.length) out.push({ type: "paragraph", content });
	};

	for (const token of tokens) {
		switch (token.type) {
			case "paragraph":
				pushParagraph(inlineFromTokens((token as Tokens.Paragraph).tokens));
				break;
			case "text": {
				const text = token as Tokens.Text;
				if (text.tokens) {
					pushParagraph(inlineFromTokens(text.tokens));
				} else {
					const content: JSONContent[] = [];
					pushMentions(content, text.text);
					pushParagraph(content);
				}
				break;
			}
			case "code": {
				const code = token as Tokens.Code;
				out.push({
					type: "codeBlock",
					attrs: { language: code.lang || null },
					content: code.text ? [textNode(code.text)] : [],
				});
				break;
			}
			// The editor has no headings, lists or quotes; they degrade to paragraphs.
			case "heading":
				pushParagraph(
					withMark(inlineFromTokens((token as Tokens.Heading).tokens), { type: "bold" }),
				);
				break;
			case "blockquote":
				out.push(...blocksFromTokens((token as Tokens.Blockquote).tokens));
				break;
			case "list": {
				const list = token as Tokens.List;
				let index = typeof list.start === "number" && list.start ? list.start : 1;
				for (const item of list.items) {
					const content: JSONContent[] = [];
					pushText(content, list.ordered ? `${index++}. ` : "• ");
					content.push(...inlineFromTokens(item.tokens));
					pushParagraph(content);
				}
				break;
			}
			case "hr":
			case "space":
				break;
			case "html": {
				const content: JSONContent[] = [];
				pushHtml(content, (token as Tokens.HTML).text.trim());
				if (content.length === 1 && content[0].type === "image") out.push(content[0]);
				else pushParagraph(content);
				break;
			}
			default: {
				const content: JSONContent[] = [];
				pushText(content, ((token as { raw?: string }).raw ?? "").trim());
				pushParagraph(content);
			}
		}
	}
	return out;
}

/** Parse a comment's Markdown back into the editor's content doc. Unsupported blocks degrade to paragraphs. */
export function markdownToContent(markdown: string): JSONContent {
	const content = blocksFromTokens(marked.lexer(markdown));
	return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}
