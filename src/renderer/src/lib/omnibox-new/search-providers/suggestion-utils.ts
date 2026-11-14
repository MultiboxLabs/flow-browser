export function mapSuggestionRelevanceByIndex(index: number): number {
  return Math.max(100, 400 - index * 40);
}
