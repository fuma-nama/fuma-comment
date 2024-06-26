import type { PresetsConfig } from "tailwindcss/types/config";
import { plugin } from "./plugin";

export function createPreset(): PresetsConfig {
  return {
    plugins: [plugin(undefined)],
    theme: {
      extend: {
        keyframes: {
          fadeIn: {
            from: { opacity: "0", transform: "translateY(20px)" },
            to: { opacity: "1", transform: "translateY(0)" },
          },
          fadeOut: {
            from: { opacity: "1", transform: "translateY(0px)" },
            to: { opacity: "0", transform: "translateY(20px)" },
          },
          dialogShow: {
            from: {
              opacity: "0",
              transform: "translate(-50%, -50%) scale(0.8)",
            },
            to: { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
          },
          dialogHide: {
            from: { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
            to: { opacity: "0", transform: "translate(-50%, -50%) scale(0.8)" },
          },
          overlayShow: {
            from: { opacity: "0" },
            to: { opacity: "1" },
          },
          overlayHide: {
            from: { opacity: "1" },
            to: { opacity: "0" },
          },
        },
        animation: {
          fadeIn: "fadeIn 200ms cubic-bezier(0.16, 1, 0.3, 1)",
          fadeOut: "fadeOut 200ms cubic-bezier(0.16, 1, 0.3, 1)",
          overlayShow: "overlayShow 400ms cubic-bezier(0.16, 1, 0.3, 1)",
          overlayHide: "overlayHide 400ms cubic-bezier(0.16, 1, 0.3, 1)",
          dialogShow: "dialogShow 400ms cubic-bezier(0.16, 1, 0.3, 1)",
          dialogHide: "dialogHide 400ms cubic-bezier(0.16, 1, 0.3, 1)",
        },
        colors: {
          "fc-border": "hsl(var(--fc-border))",
          "fc-ring": "hsl(var(--fc-ring))",
          "fc-background": "hsl(var(--fc-background))",
          "fc-foreground": "hsl(var(--fc-foreground))",
          "fc-primary": {
            DEFAULT: "hsl(var(--fc-primary))",
            foreground: "hsl(var(--fc-primary-foreground))",
          },
          "fc-muted": {
            DEFAULT: "hsl(var(--fc-muted))",
            foreground: "hsl(var(--fc-muted-foreground))",
          },
          "fc-accent": {
            DEFAULT: "hsl(var(--fc-accent))",
            foreground: "hsl(var(--fc-accent-foreground))",
          },
          "fc-popover": {
            DEFAULT: "hsl(var(--fc-popover))",
            foreground: "hsl(var(--fc-popover-foreground))",
          },
          "fc-error": {
            DEFAULT: "hsl(var(--fc-danger))",
          },
          "fc-card": {
            DEFAULT: "hsl(var(--fc-card))",
            foreground: "hsl(var(--fc-card-foreground))",
          },
        },
      },
    },
  };
}
