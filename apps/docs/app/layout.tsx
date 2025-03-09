import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { RootProvider } from "fumadocs-ui/provider";

const geist = Geist({ subsets: ["latin"] });
const mono = JetBrains_Mono({
	subsets: ["latin"],
	variable: "--default-mono-font-family",
});

export const metadata: Metadata = {
	title: "Fuma Comment",
	description: "Next.js comments",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${geist.className} ${mono.variable}`}>
				<RootProvider>{children}</RootProvider>
			</body>
		</html>
	);
}
