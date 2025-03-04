import { type ReactNode } from "react";
import { createContext, useContext } from "react";

interface UploadResponse {
	/**
	 * Absolute URL to the uploaded resource
	 */
	url: string;

	alt?: string;
	width?: number;
	height?: number;
}

export interface StorageContext {
	/**
	 * Able to upload, default: `false`
	 */
	enabled: boolean;

	/**
	 * Custom React.js component to render images
	 */
	render?: (props: {
		src: string;
		alt: string;

		width: number;
		height: number;
	}) => React.ReactNode;

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
}): ReactNode {
	return (
		<StorageContext.Provider value={storage}>
			{children}
		</StorageContext.Provider>
	);
}
