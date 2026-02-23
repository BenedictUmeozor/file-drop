import { createRouteHandler } from "uploadthing/next";
import { uploadRouter } from "@/lib/uploadthing";

// Enable debug logging for UploadThing (set to "Info" or "Error" in production)
export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
  config: {
    logLevel: process.env.NODE_ENV === "production" ? "Info" : "Debug",
  },
});
