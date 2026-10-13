import {
  ALLOWANCE_TAPER_START,
  NATIONAL_INSURANCE,
  PERIODS_PER_YEAR,
  TAX_BANDS,
  type PayPeriod,
} from "./rates";
import { penceToPounds, poundsToPence, roundHalfDownSubPence } from "./money";
import { grantsPersonalAllowance, parseTaxCode, type TaxCode } from "./taxCode";

export type Payslip = {
  period: PayPeriod;
  gross: number;
  pension: number;
  incomeTax: number;
  nationalInsurance: number;
  takeHome: number;
  /** Set for an annual salary: that year's take-home divided into 12 months. */
  monthlyTakeHome: number | null;
  annualGross: number;
  allowanceNote: boolean;
};

export type CalculateResult =
  | { ok: true; payslip: Payslip }
  | { ok: false; error: string };

export type CalculateInput = {
  gross: number;
  period: PayPeriod;
  taxCode: string;
  pensionPercent: number;
};

export function calculatePayslip(input: CalculateInput): CalculateResult {
  if (!Number.isFinite(input.gross) || input.gross < 0) {
    return { ok: false, error: "Enter your gross pay as a number." };
  }
  if (
    !Number.isFinite(input.pensionPercent) ||
    input.pensionPercent < 0 ||
    input.pensionPercent > 100
  ) {
    return { ok: false, error: "Enter a pension percentage from 0 to 100." };
  }

  const parsed = parseTaxCode(input.taxCode);
  if (!parsed.ok) return parsed;

  const periods = PERIODS_PER_YEAR[input.period];
  const grossPence = poundsToPence(input.gross);
  const pensionPence = Math.round((grossPence * input.pensionPercent) / 100);
  const payPence = grossPence - pensionPence;
  const annualPayPence = payPence * periods;

  let taxPence = periodTaxPence(annualPayPence, parsed.code, periods);
  if (parsed.code.type === "k") {
    taxPence = Math.min(taxPence, Math.floor(payPence / 2));
  }

  const niPence = nationalInsurancePence(payPence, input.period);
  const takeHomePence = grossPence - pensionPence - taxPence - niPence;

  return {
    ok: true,
    payslip: {
      period: input.period,
      gross: penceToPounds(grossPence),
      pension: penceToPounds(pensionPence),
      incomeTax: penceToPounds(taxPence),
      nationalInsurance: penceToPounds(niPence),
      takeHome: penceToPounds(takeHomePence),
      monthlyTakeHome:
        input.period === "annual" ? penceToPounds(Math.round(takeHomePence / 12)) : null,
      annualGross: penceToPounds(grossPence * periods),
      allowanceNote:
        grantsPersonalAllowance(parsed.code) &&
        annualPayPence > ALLOWANCE_TAPER_START * 100,
    },
  };
}

/** Annual tax, in 0.01-pence units, then split across the pay period. */
function periodTaxPence(annualPayPence: number, code: TaxCode, periods: number): number {
  const annualSubPence = annualTaxSubPence(annualPayPence, code);
  return Math.round(annualSubPence / periods / 100);
}

function annualTaxSubPence(annualPayPence: number, code: TaxCode): number {
  if (code.type === "none" || annualPayPence <= 0) return 0;
  if (code.type === "flat") return annualPayPence * Math.round(code.rate * 100);

  const taxablePence =
    code.type === "k"
      ? annualPayPence + code.addition * 100
      : Math.max(0, annualPayPence - code.allowance * 100);

  const basicLimit = TAX_BANDS.basicLimit * 100;
  const higherLimit = TAX_BANDS.higherLimit * 100;
  const basic = Math.min(taxablePence, basicLimit);
  const higher = Math.min(Math.max(taxablePence - basicLimit, 0), higherLimit - basicLimit);
  const additional = Math.max(taxablePence - higherLimit, 0);

  return (
    basic * Math.round(TAX_BANDS.basicRate * 100) +
    higher * Math.round(TAX_BANDS.higherRate * 100) +
    additional * Math.round(TAX_BANDS.additionalRate * 100)
  );
}

function nationalInsurancePence(payPence: number, period: PayPeriod): number {
  const thresholds = NATIONAL_INSURANCE[period];
  const primary = thresholds.primaryThreshold * 100;
  const upper = thresholds.upperEarningsLimit * 100;
  const mainPence = Math.max(0, Math.min(payPence, upper) - primary);
  const extraPence = Math.max(0, payPence - upper);
  const subPence =
    mainPence * Math.round(NATIONAL_INSURANCE.mainRate * 100) +
    extraPence * Math.round(NATIONAL_INSURANCE.upperRate * 100);
  return roundHalfDownSubPence(subPence);
}
