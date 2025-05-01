interface UploadResponse {
    /**
     * Absolute URL to the uploaded resource
     */
    url: string;
    alt?: string;
    width?: number;
    height?: number;
}
interface StorageContext {
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

export type { StorageContext as S };
