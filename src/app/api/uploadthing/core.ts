import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  fileUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
    video: { maxFileSize: "6MB", maxFileCount: 1 },
    pdf: { maxFileSize: "4MB", maxFileCount: 1 },
  }).onUploadComplete(async ({ file }) => {
    console.info("[Africhiko] project reference uploaded", {
      name: file.name,
      size: file.size,
      type: file.type,
      urlAvailable: Boolean(file.url || file.ufsUrl),
    });
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
