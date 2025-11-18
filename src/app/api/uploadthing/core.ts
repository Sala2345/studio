import { createUploadthing, type FileRouter } from "uploadthing/next";
 
const f = createUploadthing();
 
export const ourFileRouter = {
  fileUploader: f({ 
    image: { maxFileSize: "4MB" },
    audio: { maxFileSize: "8MB" },
    pdf: { maxFileSize: "8MB" }
  }).onUploadComplete(({ file }) => {
    console.log("Upload complete!", file.url);
  }),
  designFileUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 10 },
    pdf: { maxFileSize: "16MB", maxFileCount: 10 },
    video: { maxFileSize: "32MB", maxFileCount: 5 },
  })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for metadata:", metadata);
      console.log("file url", file.url);
      return { uploadedBy: metadata };
    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;
