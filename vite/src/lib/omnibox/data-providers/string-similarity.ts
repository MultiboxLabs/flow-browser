import { stringSimilarity } from "string-similarity-js";

const SIMILARITY_THRESHOLD = 0.4;

export function getStringSimilarity(str1: string, str2: string): number {
  const similarity = stringSimilarity(str1, str2);
  if (similarity >= SIMILARITY_THRESHOLD) {
    return similarity;
  }
  return 0;
}
