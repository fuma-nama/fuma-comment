import { type ReactNode, createContext, useContext } from "react";

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

const AuthContext = createContext<AuthContextType>({
  // eslint-disable-next-line @typescript-eslint/no-empty-function -- Placeholder
  signIn: () => {},
  session: null,
  status: "unauthenticated",
});

export const AuthContextProvider = AuthContext.Provider;

export function useAuthContext(): AuthContextType {
  return useContext(AuthContext);
}
