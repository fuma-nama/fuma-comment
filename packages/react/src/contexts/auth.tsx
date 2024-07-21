import React, {
  type ReactNode,
  createContext,
  useContext,
  useMemo,
} from "react";
import useSWR from "swr";
import { getAuthSession } from "../utils/fetcher";

export interface Session {
  id: string;
  permissions?: Partial<{
    /* Delete other comments */
    delete: boolean;
  }>;
}

export interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
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

export interface AuthProviderProps {
  signIn: ReactNode | (() => void);
  page: string;
}

export function AuthProvider({
  page,
  signIn,
  children,
}: AuthProviderProps & { children: ReactNode }): ReactNode {
  const query = useSWR(
    `/api/comment/${page}/auth`,
    () => getAuthSession({ page }),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    },
  );

  const value = useMemo(() => {
    return {
      session: query.data
        ? {
            id: query.data.id,
            permissions: {
              delete: query.data.role?.canDelete === true,
            },
          }
        : null,
      isLoading: query.isLoading,
      signIn,
    };
  }, [query.isLoading, query.data, signIn]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
