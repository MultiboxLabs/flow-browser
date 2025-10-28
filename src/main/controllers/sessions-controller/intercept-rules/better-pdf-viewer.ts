import { addPdfResponseToCache } from "@/modules/pdf-cache";
import { generateID } from "@/modules/utils";
import { getSettingValueById } from "@/saving/settings";
import type { Session } from "electron";
import { createBetterWebRequest } from "../web-requests";

export function setupBetterPdfViewer(session: Session) {
  const webRequest = createBetterWebRequest(session.webRequest, "better-pdf-viewer");

  // Fetch the PDF first. If it is a PDF, save it to temp and redirect to better PDF viewer
  webRequest.onBeforeRequest(
    {
      urls: ["<all_urls>"],
      types: ["mainFrame", "subFrame"]
    },
    async (details, callback) => {
      const url = details.url;
      const urlObject = URL.parse(url);
      if (!urlObject) {
        return callback({});
      }

      const { pathname } = urlObject;
      if (pathname && pathname.toLowerCase().endsWith(".pdf") && getSettingValueById("enableFlowPdfViewer") === true) {
        const response = await session.fetch(url).catch(() => null);
        if (!response) {
          return callback({});
        }

        // Check if the response is a PDF
        const contentType = response.headers.get("content-type");
        if (!contentType?.includes("application/pdf")) {
          return callback({});
        }

        // Save the PDF to a temp file
        const cacheKey = generateID();
        addPdfResponseToCache(cacheKey, response);

        // Construct the local file URL
        const localFileURL = new URL("flow://pdf-cache");
        localFileURL.searchParams.set("url", url);
        localFileURL.searchParams.set("key", cacheKey);

        // Redirect to PDF viewer with the local file path
        const viewerURL = new URL("flow://pdf-viewer");
        viewerURL.searchParams.set("url", url);
        viewerURL.searchParams.set("cacheURL", localFileURL.toString());

        return callback({ redirectURL: viewerURL.toString() });
      }

      callback({});
    }
  );
}
