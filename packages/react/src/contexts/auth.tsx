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
    throw new Error("Components must be wrapped under <CommentsProvider />");
  return auth;
}

export interface AuthOptions {
  signIn: ReactNode | (() => void);
}

export function AuthProvider({
  page,
  auth,
  children,
}: {
  page: string;
  auth: AuthOptions;
  children: ReactNode;
}): ReactNode {
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
      signIn: auth.signIn,
    };
  }, [query.isLoading, query.data, auth.signIn]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
