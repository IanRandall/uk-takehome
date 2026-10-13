/** Whole pence. */
export function poundsToPence(pounds: number): number {
  return Math.round(pounds * 100);
}

export function penceToPounds(pence: number): number {
  return pence / 100;
}

/**
 * HMRC exact-percentage rounding: nearest penny, and half a penny or less
 * is disregarded. `subPence` is an integer count of 0.01 pence.
 */
export function roundHalfDownSubPence(subPence: number): number {
  const pence = Math.trunc(subPence / 100);
  const remainder = subPence % 100;
  return remainder > 50 ? pence + 1 : pence;
}
