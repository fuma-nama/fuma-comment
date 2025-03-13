import { genUploader } from "uploadthing/client";
import type { StorageContext } from "../contexts/storage";

const { uploadFiles } = genUploader();

export function createUploadThingStorage(): StorageContext {
	return {
		enabled: true,
		async upload(file) {
			const res = await uploadFiles("imageUploader", {
				files: [file as File],
			});

			if (res.length === 0) throw new Error("Failed to upload file");

			const img = new Image();
			img.src = URL.createObjectURL(file);

			const size = await new Promise<{ width: number; height: number }>(
				(resolve) => {
					img.onload = () => {
						resolve({
							width: img.width,
							height: img.height,
						});
					};
				},
			);

			URL.revokeObjectURL(img.src);

			return {
				url: res[0].ufsUrl,
				width: size.width,
				height: size.height,
			};
		},
	};
}
