import {
  __async
} from "../chunk-BBZEL7EG.js";

// src/uploadthing/index.ts
import { genUploader } from "uploadthing/client";
var { uploadFiles } = genUploader();
function createUploadThingStorage() {
  return {
    enabled: true,
    upload(file) {
      return __async(this, null, function* () {
        const res = yield uploadFiles("imageUploader", {
          files: [file]
        });
        if (res.length === 0) throw new Error("Failed to upload file");
        const img = new Image();
        img.src = URL.createObjectURL(file);
        const size = yield new Promise(
          (resolve) => {
            img.onload = () => {
              resolve({
                width: img.width,
                height: img.height
              });
            };
          }
        );
        URL.revokeObjectURL(img.src);
        return {
          url: res[0].ufsUrl,
          width: size.width,
          height: size.height
        };
      });
    }
  };
}
export {
  createUploadThingStorage
};
