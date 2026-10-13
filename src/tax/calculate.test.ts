import { describe, expect, it } from "vitest";
import { calculatePayslip } from "./calculate";
import { SCOTTISH_TAX_CODE_ERROR } from "./taxCode";

function payslip(input: Parameters<typeof calculatePayslip>[0]) {
  const result = calculatePayslip(input);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error);
  return result.payslip;
}

describe("calculatePayslip", () => {
  it("matches the HMRC weekly National Insurance example", () => {
    const slip = payslip({
      gross: 1000,
      period: "weekly",
      taxCode: "1257L",
      pensionPercent: 0,
    });

    expect(slip.nationalInsurance).toBe(58.66);
    expect(slip.incomeTax).toBe(158.31);
    expect(slip.takeHome).toBe(783.03);
  });

  it("calculates a monthly salary on 1257L", () => {
    const slip = payslip({
      gross: 3000,
      period: "monthly",
      taxCode: "1257L",
      pensionPercent: 0,
    });

    expect(slip.pension).toBe(0);
    expect(slip.incomeTax).toBe(390.5);
    expect(slip.nationalInsurance).toBe(156.16);
    expect(slip.takeHome).toBe(2453.34);
    expect(slip.monthlyTakeHome).toBeNull();
    expect(slip.annualGross).toBe(36000);
    expect(slip.allowanceNote).toBe(false);
  });

  it("calculates an annual salary on 1257L", () => {
    const slip = payslip({
      gross: 36000,
      period: "annual",
      taxCode: "1257L",
      pensionPercent: 0,
    });

    expect(slip.incomeTax).toBe(4686);
    expect(slip.nationalInsurance).toBe(1874.4);
    expect(slip.takeHome).toBe(29439.6);
    expect(slip.monthlyTakeHome).toBe(2453.3);
    expect(slip.annualGross).toBe(36000);
    expect(slip.allowanceNote).toBe(false);
  });

  it("takes salary sacrifice off an annual salary before tax and National Insurance", () => {
    const slip = payslip({
      gross: 36000,
      period: "annual",
      taxCode: "1257L",
      pensionPercent: 5,
    });

    expect(slip.pension).toBe(1800);
    expect(slip.incomeTax).toBe(4326);
    expect(slip.nationalInsurance).toBe(1730.4);
    expect(slip.takeHome).toBe(28143.6);
    expect(slip.monthlyTakeHome).toBe(2345.3);
  });

  it("takes a salary-sacrifice pension before tax and National Insurance", () => {
    const slip = payslip({
      gross: 3000,
      period: "monthly",
      taxCode: "1257l",
      pensionPercent: 5,
    });

    expect(slip.pension).toBe(150);
    expect(slip.incomeTax).toBe(360.5);
    expect(slip.nationalInsurance).toBe(144.16);
    expect(slip.takeHome).toBe(2345.34);
  });

  it("applies the higher rate on a £5,000 month", () => {
    const slip = payslip({
      gross: 5000,
      period: "monthly",
      taxCode: "1257L",
      pensionPercent: 0,
    });

    expect(slip.incomeTax).toBe(952.67);
    expect(slip.nationalInsurance).toBe(267.5);
    expect(slip.takeHome).toBe(3779.83);
  });

  it("applies the additional rate and rounds half a penny up", () => {
    const slip = payslip({
      gross: 12000,
      period: "monthly",
      taxCode: "1257L",
      pensionPercent: 0,
    });

    expect(slip.incomeTax).toBe(3778.88);
    expect(slip.nationalInsurance).toBe(407.5);
    expect(slip.takeHome).toBe(7813.62);
    expect(slip.allowanceNote).toBe(true);
  });

  it("taxes a BR code at 20% with no allowance", () => {
    const slip = payslip({
      gross: 3000,
      period: "monthly",
      taxCode: "BR",
      pensionPercent: 0,
    });

    expect(slip.incomeTax).toBe(600);
    expect(slip.nationalInsurance).toBe(156.16);
    expect(slip.takeHome).toBe(2243.84);
    expect(slip.allowanceNote).toBe(false);
  });

  it("adds a K code to taxable pay", () => {
    const slip = payslip({
      gross: 3000,
      period: "monthly",
      taxCode: "K100",
      pensionPercent: 0,
    });

    expect(slip.incomeTax).toBe(616.67);
    expect(slip.nationalInsurance).toBe(156.16);
    expect(slip.takeHome).toBe(2227.17);
  });

  it("caps K-code tax at half the pay after sacrifice", () => {
    const slip = payslip({
      gross: 100,
      period: "weekly",
      taxCode: "K5000",
      pensionPercent: 0,
    });

    expect(slip.incomeTax).toBe(50);
    expect(slip.nationalInsurance).toBe(0);
    expect(slip.takeHome).toBe(50);
  });

  it("treats a Welsh code and a non-cumulative suffix like 1257L", () => {
    const standard = payslip({
      gross: 3000,
      period: "monthly",
      taxCode: "1257L",
      pensionPercent: 0,
    });
    const welsh = payslip({
      gross: 3000,
      period: "monthly",
      taxCode: "C1257L W1",
      pensionPercent: 0,
    });

    expect(welsh.incomeTax).toBe(standard.incomeTax);
    expect(welsh.nationalInsurance).toBe(standard.nationalInsurance);
  });

  it("disregards half a penny of National Insurance", () => {
    const onLimit = payslip({
      gross: 4189,
      period: "monthly",
      taxCode: "NT",
      pensionPercent: 0,
    });
    const halfPennyOver = payslip({
      gross: 4189.25,
      period: "monthly",
      taxCode: "NT",
      pensionPercent: 0,
    });
    const justOver = payslip({
      gross: 4189.26,
      period: "monthly",
      taxCode: "NT",
      pensionPercent: 0,
    });

    expect(onLimit.incomeTax).toBe(0);
    expect(halfPennyOver.nationalInsurance).toBe(onLimit.nationalInsurance);
    expect(justOver.nationalInsurance).toBe(onLimit.nationalInsurance + 0.01);
  });

  it("rejects an invalid tax code", () => {
    const result = calculatePayslip({
      gross: 3000,
      period: "monthly",
      taxCode: "nope",
      pensionPercent: 0,
    });

    expect(result.ok).toBe(false);
  });

  it("rejects a Scottish tax code", () => {
    const result = calculatePayslip({
      gross: 3000,
      period: "monthly",
      taxCode: "S1257L",
      pensionPercent: 0,
    });

    expect(result).toEqual({ ok: false, error: SCOTTISH_TAX_CODE_ERROR });
  });
});
