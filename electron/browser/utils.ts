import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

export async function isFileExists(filePath: string) {
  return await fsPromises
    .access(filePath, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);
}

export function getContentType(filePath: string) {
  const fileExtension = path.extname(filePath).toLowerCase();
  let contentType = "text/plain";

  switch (fileExtension) {
    case ".html":
      contentType = "text/html";
      break;
    case ".js":
      contentType = "application/javascript";
      break;
    case ".css":
      contentType = "text/css";
      break;
    case ".json":
      contentType = "application/json";
      break;
    case ".png":
      contentType = "image/png";
      break;
    case ".jpg":
    case ".jpeg":
      contentType = "image/jpeg";
      break;
    case ".svg":
      contentType = "image/svg+xml";
      break;
  }

  return contentType;
}
