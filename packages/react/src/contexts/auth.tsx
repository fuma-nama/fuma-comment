import { createContext, type ReactNode, use, useMemo } from "react";
import useSWRImmutable from "swr/immutable";
import { useCommentsContext } from "./comments";

interface Session {
  id: string;
  permissions?: Partial<{
    /* Delete other comments */
    delete: boolean;
  }>;
}

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  signIn: ReactNode | (() => void);
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function useAuthContext(): AuthContextType {
  const auth = use(AuthContext);

  if (!auth)
    throw new Error("Components must be wrapped under <CommentsProvider />");
  return auth;
}

type AuthOptions =
  | {
      type: "api";
      signIn: ReactNode | (() => void);
    }
  | {
      type: "ssr";
      session: Session | null;
      signIn: ReactNode | (() => void);
    };

function AuthProvider({
  page,
  auth,
  children,
}: {
  page: string;
  auth: AuthOptions;
  children: ReactNode;
}): ReactNode {
  const { fetcher } = useCommentsContext();
  const query = useSWRImmutable(
    auth.type === "api" ? `/api/comment/${page}/auth` : null,
    () => fetcher.getAuthSession({ page }),
    {
      shouldRetryOnError: false,
    },
  );

  const value = useMemo<AuthContextType>(() => {
    if (auth.type === "ssr")
      return {
        isLoading: false,
        session: auth.session,
        signIn: auth.signIn,
      };

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
  }, [auth, query.data, query.isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthProvider, useAuthContext, type AuthOptions, type AuthContextType };
