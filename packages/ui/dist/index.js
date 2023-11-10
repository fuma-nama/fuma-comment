// card.tsx
import { jsx, jsxs } from "react/jsx-runtime";
function Card({
  className,
  title,
  children,
  href
}) {
  return /* @__PURE__ */ jsxs(
    "a",
    {
      className,
      href: `${href}?utm_source=create-turbo&utm_medium=basic&utm_campaign=create-turbo"`,
      rel: "noopener noreferrer",
      target: "_blank",
      children: [
        /* @__PURE__ */ jsxs("h2", { children: [
          title,
          " ",
          /* @__PURE__ */ jsx("span", { children: "->" })
        ] }),
        /* @__PURE__ */ jsx("p", { children })
      ]
    }
  );
}
export {
  Card
};
