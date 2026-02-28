/**
 * Frecency calculation for omnibox scoring.
 * Combines frequency and recency with exponential decay.
 */

/** Visit type weights matching Chromium's weighting */
const TYPE_WEIGHTS: Record<number, number> = {
  0: 1.0, // LINK
  1: 4.0, // TYPED (explicitly typed in omnibox)
  2: 2.0, // BOOKMARK (navigated via bookmark)
  3: 0.3, // REDIRECT (automatic redirect)
  4: 0.5 // RELOAD (page reload)
};

/**
 * Calculate a frecency score for a history entry.
 *
 * Uses exponential decay with a configurable half-life.
 * More recent and more-typed visits contribute more to the score.
 *
 * @param visitCount Total number of visits
 * @param typedCount Number of typed visits
 * @param lastVisitTime Timestamp of last visit (epoch ms)
 * @param lastVisitType Type of last visit (0=link, 1=typed, etc.)
 * @param halfLifeDays Half-life for decay in days (default: 30)
 * @returns Frecency score (higher = more relevant)
 */
export function calculateFrecency(
  visitCount: number,
  typedCount: number,
  lastVisitTime: number,
  lastVisitType: number = 0,
  halfLifeDays: number = 30
): number {
  const lambda = Math.LN2 / (halfLifeDays * 86400000); // decay constant in ms
  const now = Date.now();
  const elapsed = now - lastVisitTime;
  const decay = Math.exp(-lambda * elapsed);

  // Weight the last visit type
  const typeWeight = TYPE_WEIGHTS[lastVisitType] ?? 1.0;

  // Typed visits are worth more
  const typedBonus = typedCount > 0 ? Math.log1p(typedCount) * 2 : 0;

  // Base score from visit count (sublinear to prevent dominance)
  const visitScore = Math.log1p(visitCount);

  // Combined: decay * (type-weighted visit score + typed bonus)
  return decay * (typeWeight * visitScore + typedBonus);
}

/**
 * Calculate a simplified frecency score suitable for sorting.
 * Uses only visit count and recency for a fast computation.
 *
 * @param visitCount Total number of visits
 * @param lastVisitTime Timestamp of last visit (epoch ms)
 * @returns Simple frecency score
 */
export function calculateSimpleFrecency(visitCount: number, lastVisitTime: number): number {
  const now = Date.now();
  const hoursAgo = (now - lastVisitTime) / 3600000;

  // Decay factor: halves every 72 hours
  const decay = Math.pow(0.5, hoursAgo / 72);

  // Visit count contribution (sublinear)
  const visitScore = Math.log1p(visitCount);

  return decay * visitScore;
}
