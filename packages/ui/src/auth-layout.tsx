import { useMemo, type ReactNode } from "react";
import type { AuthContextType } from "./contexts/auth";
import { AuthContextProvider } from "./contexts/auth";

interface AuthLayoutProps extends AuthContextType {
  children: ReactNode;
}

export function AuthLayout({
  session,
  status,
  signIn,
  children,
}: AuthLayoutProps): JSX.Element {
  const value = useMemo(
    () => ({ session, status, signIn }),
    [session, status, signIn]
  );

  return <AuthContextProvider value={value}>{children}</AuthContextProvider>;
}
