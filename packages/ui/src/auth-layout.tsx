import { useMemo, type ReactNode } from "react";
import type { AuthContextType } from "./contexts/auth";
import { AuthContext } from "./contexts/auth";

interface AuthLayoutProps extends AuthContextType {
  signIn: ReactNode | (() => void);
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
