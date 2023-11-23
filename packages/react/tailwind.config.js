/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class", "[class~=dark]"],
  content: ["./src/**/*.{ts,tsx}"],
  prefix: "fc-",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--fc-border))",
        ring: "hsl(var(--fc-ring))",
        background: "hsl(var(--fc-background))",
        foreground: "hsl(var(--fc-foreground))",
        primary: {
          DEFAULT: "hsl(var(--fc-primary))",
          foreground: "hsl(var(--fc-primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--fc-muted))",
          foreground: "hsl(var(--fc-muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--fc-accent))",
          foreground: "hsl(var(--fc-accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--fc-popover))",
          foreground: "hsl(var(--fc-popover-foreground))",
        },
        error: {
          DEFAULT: "hsl(var(--fc-danger))",
        },
        card: {
          DEFAULT: "hsl(var(--fc-card))",
          foreground: "hsl(var(--fc-card-foreground))",
        },
      },
    },
  },
};
