export type BangEntry = {
  /** category */
  c?: string;
  /** subcategory */
  sc?: string;
  /** domain */
  d: string;
  /** relevance */
  r: number;
  /** display name / site name */
  s: string;
  /** bang trigger text */
  t: string;
  /** search url template, with {{{s}}} replaced with the search query */
  u: string;
};

let bangs: BangEntry[] | undefined;
let bangsPromise: Promise<typeof bangs> | undefined;

export async function preloadBangs() {
  if (bangs) return false;
  const bangsModule = (await import("./bangs")) as unknown as { bangs: BangEntry[] };
  bangs = bangsModule.bangs as BangEntry[];
  return true;
}

export function getBangs() {
  if (bangs) return bangs;
  if (!bangsPromise) {
    bangsPromise = preloadBangs().then(() => {
      bangsPromise = undefined;
      return bangs;
    });
  }
  return [];
}

getBangs();
