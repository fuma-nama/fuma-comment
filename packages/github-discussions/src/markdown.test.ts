import { describe, expect, test } from "vitest";
import { contentToMarkdown, type JSONContent, markdownToContent } from "./markdown";

const doc = (...content: JSONContent[]): JSONContent => ({ type: "doc", content });
const paragraph = (...content: JSONContent[]): JSONContent => ({ type: "paragraph", content });
const text = (value: string, marks?: JSONContent["marks"]): JSONContent =>
	marks ? { type: "text", text: value, marks } : { type: "text", text: value };

/** Every text node ProseMirror receives must be non-empty, at any depth. */
function expectNoEmptyText(node: JSONContent): void {
	if (node.type === "text") expect(node.text).not.toBe("");
	for (const child of node.content ?? []) expectNoEmptyText(child);
}

describe("editor doc -> markdown", () => {
	test("escapes markdown so plain text stays plain", () => {
		expect(contentToMarkdown(doc(paragraph(text("a *b* _c_ [d](e) <f> & ~g~"))))).toBe(
			"a \\*b\\* \\_c\\_ \\[d\\](e) \\<f> \\& \\~g\\~",
		);
	});

	test("escapes block markers on every line", () => {
		expect(contentToMarkdown(doc(paragraph(text("# not a heading"))))).toBe("\\# not a heading");
		expect(contentToMarkdown(doc(paragraph(text("- a\n1. b\n> c"))))).toBe("\\- a\n1\\. b\n\\> c");
	});

	test("widens the fence when inline code contains backticks", () => {
		const content = doc(paragraph(text("a``b", [{ type: "code" }])));
		expect(contentToMarkdown(content)).toBe("```a``b```");
	});

	test("widens the fence when a code block contains one", () => {
		const content = doc({
			type: "codeBlock",
			attrs: { language: "md" },
			content: [text("```\nnested\n```")],
		});
		expect(contentToMarkdown(content)).toBe("````md\n```\nnested\n```\n````");
	});

	test("keeps blank lines inside a code block", () => {
		const content = doc({
			type: "codeBlock",
			attrs: { language: null },
			content: [text("a\n\n\nb")],
		});
		expect(contentToMarkdown(content)).toBe("```\na\n\n\nb\n```");
	});

	test("wraps link destinations that contain spaces or parens", () => {
		const content = doc(
			paragraph(text("x", [{ type: "link", attrs: { href: "https://a.dev/b(c)" } }])),
		);
		expect(contentToMarkdown(content)).toBe("[x](<https://a.dev/b(c)>)");
	});

	test("drops empty blocks instead of leaving blank runs", () => {
		const content = doc(paragraph(text("a")), paragraph(), paragraph(text("b")));
		expect(contentToMarkdown(content)).toBe("a\n\nb");
	});

	test("serializes mentions by login", () => {
		const content = doc(paragraph({ type: "mention", attrs: { id: "octocat", label: "Octo" } }));
		expect(contentToMarkdown(content)).toBe("@octocat");
	});
});

describe("markdown -> editor doc", () => {
	test("an empty body still produces a valid doc", () => {
		expect(markdownToContent("")).toEqual(doc({ type: "paragraph" }));
	});

	test("inline html never yields an empty text node", () => {
		for (const body of ["a<br>b", "<img src='x.png'>", "<details><summary>s</summary></details>"]) {
			expectNoEmptyText(markdownToContent(body));
		}
	});

	test("a hard break becomes a newline the renderer can show", () => {
		expect(markdownToContent("a  \nb")).toEqual(doc(paragraph(text("a"), text("\n"), text("b"))));
	});

	test("a bare markdown image degrades to a link, never a dimensionless image", () => {
		const content = markdownToContent("![alt](https://a.dev/b.png)");
		expect(content).toEqual(
			doc(paragraph(text("alt", [{ type: "link", attrs: { href: "https://a.dev/b.png" } }]))),
		);
	});

	test("parses mentions out of plain text", () => {
		expect(markdownToContent("hi @octocat!")).toEqual(
			doc(
				paragraph(
					text("hi "),
					{ type: "mention", attrs: { id: "octocat", label: "octocat" } },
					text("!"),
				),
			),
		);
	});

	test("an email address is not a mention", () => {
		// GFM autolinks it, the same as GitHub does; what matters is that no mention node appears.
		expect(markdownToContent("a@b.dev")).toEqual(
			doc(paragraph(text("a@b.dev", [{ type: "link", attrs: { href: "mailto:a@b.dev" } }]))),
		);
	});

	test("headings and lists degrade to paragraphs", () => {
		expect(markdownToContent("# Title")).toEqual(doc(paragraph(text("Title", [{ type: "bold" }]))));
		expect(markdownToContent("- a\n- b")).toEqual(
			doc(paragraph(text("• "), text("a")), paragraph(text("• "), text("b"))),
		);
	});
});

describe("round trip", () => {
	const cases: [name: string, markdown: string][] = [
		["plain text", "hello world"],
		["escaped metacharacters", "a \\*b\\* \\_c\\_ \\[d\\]"],
		["bold and italic", "**a** and _b_"],
		["strikethrough", "~~gone~~"],
		["inline code", "`const a = 1`"],
		["a link", "[docs](https://fuma-comment.vercel.app)"],
		["a mention", "cc @octocat"],
		["a code block", "```ts\nconst a = 1;\n\n\nconst b = 2;\n```"],
		["a sized image", '<img src="https://a.dev/b.png" alt="cat" width="600" height="400">'],
		["paragraphs", "first\n\nsecond"],
	];

	test.each(cases)("%s survives markdown -> doc -> markdown", (_name, markdown) => {
		expect(contentToMarkdown(markdownToContent(markdown))).toBe(markdown);
	});

	test.each(cases)("%s produces no empty text nodes", (_name, markdown) => {
		expectNoEmptyText(markdownToContent(markdown));
	});

	test("a sized image keeps the dimensions the editor requires", () => {
		const content = markdownToContent(
			'<img src="https://a.dev/b.png" alt="cat" width="600" height="400">',
		);
		expect(content.content?.[0]).toEqual({
			type: "image",
			attrs: { src: "https://a.dev/b.png", alt: "cat", width: 600, height: 400 },
		});
	});
});
