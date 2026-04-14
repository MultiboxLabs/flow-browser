import { BrowserWindow } from "@/controllers/windows-controller/types";
import { dialog } from "electron";
import fs from "fs/promises";
import { extension as getExtension } from "mime-types";
import path from "node:path";

interface ImageResource {
  data: Buffer;
  mimeType: string | null;
  fileName: string | null;
}

export async function saveImageAs(
  parameters: Electron.ContextMenuParams,
  webContents: Electron.WebContents,
  window: BrowserWindow
) {
  try {
    const imageResource = await getImageResourceFromSession(webContents, parameters);

    const defaultFileName = getSuggestedImageFileName(
      parameters.srcURL,
      imageResource.mimeType,
      imageResource.fileName
    );
    const extension = getFileExtension(defaultFileName, imageResource.mimeType);
    const { canceled, filePath } = await dialog.showSaveDialog(window.browserWindow, {
      defaultPath: defaultFileName,
      filters: extension ? [{ name: "Image", extensions: [extension] }] : undefined
    });

    if (canceled || !filePath) {
      return;
    }

    await fs.writeFile(filePath, imageResource.data);
  } catch (error) {
    console.error("Failed to save image from context menu:", error);
    dialog.showErrorBox("Unable to Save Image", "Flow couldn't save this image from the current page.");
  }
}

async function getImageResourceFromSession(
  webContents: Electron.WebContents,
  parameters: Electron.ContextMenuParams
): Promise<ImageResource> {
  const response = await webContents.session.fetch(parameters.srcURL, {
    cache: "force-cache",
    credentials: "include",
    referrer: getFetchReferrer(parameters.referrerPolicy),
    referrerPolicy: getFetchReferrerPolicy(parameters.referrerPolicy),
    // abort after 10 seconds
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(`Image fetch failed with status ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    data: Buffer.from(arrayBuffer),
    mimeType: response.headers.get("content-type"),
    fileName: getFileNameFromContentDisposition(response.headers.get("content-disposition"))
  };
}

function getFetchReferrer(referrer: Electron.Referrer): string | undefined {
  return referrer.url || undefined;
}

function getFetchReferrerPolicy(referrer: Electron.Referrer): RequestInit["referrerPolicy"] | undefined {
  if (referrer.policy === "default") {
    return undefined;
  }

  return referrer.policy;
}

function getSuggestedImageFileName(srcURL: string, mimeType: string | null, preferredFileName: string | null): string {
  const rawFileName = preferredFileName || getFileNameFromURL(srcURL) || "image";
  const sanitizedFileName = sanitizeFileName(rawFileName);
  if (path.extname(sanitizedFileName)) {
    return sanitizedFileName;
  }

  const extension = getFileExtension(sanitizedFileName, mimeType);
  return extension ? `${sanitizedFileName}.${extension}` : sanitizedFileName;
}

function getFileNameFromURL(srcURL: string): string | null {
  try {
    const fileName = decodeURIComponent(path.basename(new URL(srcURL).pathname));
    return fileName && fileName !== "/" ? fileName : null;
  } catch {
    return null;
  }
}

function getFileNameFromContentDisposition(contentDisposition: string | null): string | null {
  if (!contentDisposition) {
    return null;
  }

  const utf8FileNameMatch = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8FileNameMatch) {
    return utf8FileNameMatch[1] ? decodeURIComponent(utf8FileNameMatch[1]) : null;
  }

  const fileNameMatch =
    contentDisposition.match(/filename\s*=\s*"([^"]+)"/i) ?? contentDisposition.match(/filename\s*=\s*([^;]+)/i);
  return fileNameMatch?.[1]?.trim() || null;
}

function sanitizeFileName(fileName: string): string {
  const sanitized = fileName
    .trim()
    .replace(/[<>:"/\\|?*]/g, "_")
    .replaceAll(/[\n\r\t]/g, "_");
  return sanitized || "image";
}

function getFileExtension(fileName: string, mimeType: string | null): string | null {
  const fileNameExtension = path.extname(fileName).replace(/^\./, "");
  if (fileNameExtension) {
    return fileNameExtension;
  }

  const normalizedMimeType = mimeType?.split(";")[0]?.trim();
  if (!normalizedMimeType) {
    return null;
  }

  return getExtension(normalizedMimeType) || null;
}
