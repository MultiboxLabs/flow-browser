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
let bangsPromise: Promise<BangEntry[]> | undefined;

async function preloadBangs() {
  if (bangs) return false;
  const bangsModule = (await import("./bangs")) as unknown as { bangs: BangEntry[] };
  bangs = bangsModule.bangs;
  return true;
}

export async function waitForBangsLoad() {
  if (bangs) return bangs;
  getBangs();
  if (bangsPromise) {
    return await bangsPromise;
  }
  throw new Error("Bangs not loaded - should be unreachable!!");
}

export function getBangs() {
  if (bangs) return bangs;
  if (!bangsPromise) {
    bangsPromise = preloadBangs().then(() => {
      bangsPromise = undefined;
      if (bangs) return bangs;
      throw new Error("Bangs not loaded after preload - should be unreachable!!");
    });
  }
  return [];
}

getBangs();
