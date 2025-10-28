/**
 * PDF Cache
 * This module is used to cache PDF responses for the custom PDF viewer
 */

const PDF_CACHE = new Map<string, Response>();

export function addPdfResponseToCache(key: string, response: Response) {
  PDF_CACHE.set(key, response);
}

export function getPdfResponseFromCache(key: string): Response | undefined {
  return PDF_CACHE.get(key);
}

export function removePdfResponseFromCache(key: string) {
  PDF_CACHE.delete(key);
}
