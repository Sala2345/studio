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
    image: { maxFileSize: "16MB", maxFileCount: 10 },
    video: { maxFileSize: "64MB", maxFileCount: 5 },
    pdf: { maxFileSize: "32MB", maxFileCount: 10 },
    text: { maxFileSize: "4MB", maxFileCount: 10 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "16MB", maxFileCount: 10 },
    "application/zip": { maxFileSize: "128MB", maxFileCount: 1 },
  }).onUploadComplete(({ file }) => {
    console.log("Design file upload complete for file: ", file.url);
  }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;
