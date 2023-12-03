import type { ReactNode } from "react";
import { createContext, useContext } from "react";

interface UploadResponse {
  /**
   * Absolute URL to the uploaded resource
   */
  url: string;
}

export interface StorageContext {
  /**
   * Able to upload, default: `false`
   */
  enabled: boolean;

  upload: (file: Blob) => Promise<UploadResponse>;
}

const StorageContext = createContext<StorageContext>({
  enabled: false,
  upload: () => {
    throw new Error("Not implemented");
  },
});

export function useStorage(): StorageContext {
  return useContext(StorageContext);
}

export function StorageProvider({
  storage,
  children,
}: {
  storage: StorageContext;
  children: ReactNode;
}): JSX.Element {
  return (
    <StorageContext.Provider value={storage}>
      {children}
    </StorageContext.Provider>
  );
}
