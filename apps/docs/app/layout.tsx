import "@fuma-comment/react/dist/style.css";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { RootProvider } from "next-docs-ui/provider";
import { AuthProvider } from "./layout.client";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fuma Comment",
  description: "Next.js comments",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <RootProvider>
          <AuthProvider>{children}</AuthProvider>
        </RootProvider>
      </body>
    </html>
  );
}
