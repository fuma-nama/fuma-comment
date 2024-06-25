import { type ReactNode, createContext, useContext, useMemo } from "react";

export interface Session {
  id: string;
  permissions?: Partial<{
    /* Delete other comments */
    delete: boolean;
  }>;
}

export interface AuthContextType {
  session: Session | null;
  status: "authenticated" | "loading" | "unauthenticated";
  signIn: ReactNode | (() => void);
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuthContext(): AuthContextType {
  const auth = useContext(AuthContext);

  if (!auth)
    throw new Error(
      "<Comments /> component must be wrapped under <AuthProvider />",
    );
  return auth;
}

export interface AuthProviderProps extends AuthContextType {
  children: ReactNode;
}

export function AuthProvider({
  session,
  status,
  signIn,
  children,
}: AuthProviderProps): JSX.Element {
  const value = useMemo(
    () => ({ session, status, signIn }),
    [session, status, signIn],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
