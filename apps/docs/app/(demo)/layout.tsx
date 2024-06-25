import "@fuma-comment/react/style.css";
import "../globals.css";
import { AuthProvider } from "./layout.client";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return <AuthProvider>{children}</AuthProvider>;
}
