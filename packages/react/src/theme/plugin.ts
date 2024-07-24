import { withOptions } from "tailwindcss/plugin";

const converted = {
  ":root": {
    "--fc-background": "0 0% 100%",
    "--fc-foreground": "0 0% 3.9%",
    "--fc-muted": "0 0% 96.1%",
    "--fc-muted-foreground": "0 0% 45.1%",
    "--fc-popover": "0 0% 100%",
    "--fc-popover-foreground": "0 0% 15.1%",
    "--fc-card": "0 0% 96.7%",
    "--fc-card-foreground": "0 0% 3.9%",
    "--fc-border": "0 0% 89.8%",
    "--fc-primary": "0 0% 9%",
    "--fc-primary-foreground": "0 0% 98%",
    "--fc-accent": "0 0% 94.1%",
    "--fc-accent-foreground": "0 0% 9%",
    "--fc-danger": "3 99% 55%",
    "--fc-ring": "0 0% 63.9%",
  },
  ".dark": {
    "--fc-background": "0 0% 3.9%",
    "--fc-foreground": "0 0% 98%",
    "--fc-muted": "0 0% 14.9%",
    "--fc-muted-foreground": "0 0% 60.9%",
    "--fc-popover": "0 0% 7%",
    "--fc-popover-foreground": "0 0% 88%",
    "--fc-card": "0 0% 8%",
    "--fc-card-foreground": "0 0% 98%",
    "--fc-border": "0 0% 18%",
    "--fc-primary": "0 0% 98%",
    "--fc-primary-foreground": "0 0% 9%",
    "--fc-accent": "0 0% 14.9%",
    "--fc-accent-foreground": "0 0% 98%",
    "--fc-ring": "0 0% 14.9%",
    "--fc-danger": "3 95% 64%",
  },
  ".tiptap p.is-editor-empty:first-child::before": {
    content: "attr(data-placeholder)",
    float: "left",
    height: "0",
    "pointer-events": "none",
    "@apply text-sm text-fc-muted-foreground": {},
  },

  ".tiptap img": {
    "@apply rounded-lg max-w-full w-auto max-h-60": {},
  },

  ".tiptap img.ProseMirror-selectednode": {
    "@apply ring-2 ring-fc-primary": {},
  },

  ".tiptap a": {
    "@apply font-medium underline": {},
  },
};

export const plugin = withOptions(() => {
  return (api) => {
    api.addBase(converted);
  };
});
