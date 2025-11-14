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
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;
