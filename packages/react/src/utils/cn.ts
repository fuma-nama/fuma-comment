import { createTailwindMerge, getDefaultConfig } from "tailwind-merge";

export const cn = createTailwindMerge(() => ({
	...getDefaultConfig(),
}));
