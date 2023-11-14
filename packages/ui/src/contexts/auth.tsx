import { type ReactNode, createContext } from "react";

export interface Session {
  id: string;
}

export interface AuthContextType {
  session: Session | null;
  status: "authenticated" | "loading" | "unauthenticated";
  signIn: ReactNode | (() => void);
}

export const AuthContext = createContext<AuthContextType>({
  // eslint-disable-next-line @typescript-eslint/no-empty-function -- Placeholder
  signIn: () => {},
  session: null,
  status: "unauthenticated",
});
