import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
	title: "fuma-comment + GitHub Discussions",
	description:
		"Comments stored in GitHub Discussions, via @fuma-comment/server/adapters/github-discussions.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en">
			<body className={`${geist.variable} antialiased`}>{children}</body>
		</html>
	);
}
