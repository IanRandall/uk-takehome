/** England, Wales, and Northern Ireland, 6 April 2026 to 5 April 2027. */
export const TAX_YEAR_LABEL = "2026/27";

/** Personal allowance starts to be withdrawn above this annual income. */
export const ALLOWANCE_TAPER_START = 100_000;

/**
 * Income Tax on pay above the tax-code allowance.
 * https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027
 */
export const TAX_BANDS = {
  basicLimit: 37_700,
  higherLimit: 125_140,
  basicRate: 0.2,
  higherRate: 0.4,
  additionalRate: 0.45,
} as const;

/** Employee Class 1 National Insurance, category A. */
export const NATIONAL_INSURANCE = {
  weekly: { primaryThreshold: 242, upperEarningsLimit: 967 },
  monthly: { primaryThreshold: 1_048, upperEarningsLimit: 4_189 },
  annual: { primaryThreshold: 12_570, upperEarningsLimit: 50_270 },
  mainRate: 0.08,
  upperRate: 0.02,
} as const;

export const PERIODS_PER_YEAR = {
  weekly: 52,
  monthly: 12,
  annual: 1,
} as const;

export type PayPeriod = keyof typeof PERIODS_PER_YEAR;
