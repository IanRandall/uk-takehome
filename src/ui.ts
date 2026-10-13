import { calculatePayslip, type Payslip } from "./tax/calculate";
import { TAX_YEAR_LABEL, type PayPeriod } from "./tax/rates";
import { formatPounds } from "./format";

export type FormValues = {
  gross: string;
  period: PayPeriod;
  taxCode: string;
  pension: string;
};

const PERIOD_LABEL: Record<PayPeriod, string> = {
  weekly: "Week",
  monthly: "Month",
  annual: "Year",
};

export function renderPayslip(root: HTMLElement, values: FormValues): void {
  root.replaceChildren();
  const slip = document.createElement("article");
  slip.className = "slip";

  const outcome = readPayslip(values);
  if (!outcome.ok) {
    slip.append(slipHeader(values.period), message(outcome.error));
    root.append(slip);
    return;
  }

  slip.append(slipHeader(values.period), rows(outcome.payslip), takeHome(outcome.payslip));
  if (outcome.payslip.period !== "annual") slip.append(equivalentLine(outcome.payslip));
  if (outcome.payslip.allowanceNote) slip.append(allowanceNote());
  root.append(slip);
}

function readPayslip(values: FormValues): { ok: true; payslip: Payslip } | { ok: false; error: string } {
  const gross = parseAmount(values.gross);
  if (gross === null) return { ok: false, error: "Enter your gross pay." };
  if (Number.isNaN(gross)) return { ok: false, error: "Enter your gross pay as a number." };

  const pension = parseAmount(values.pension);
  if (pension === null || Number.isNaN(pension)) {
    return { ok: false, error: "Enter a pension percentage from 0 to 100." };
  }

  return calculatePayslip({
    gross,
    period: values.period,
    taxCode: values.taxCode,
    pensionPercent: pension,
  });
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.trim().replace(/[£,%\s]/g, "");
  if (cleaned === "") return null;
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return Number.NaN;
  return Number(cleaned);
}

function slipHeader(period: PayPeriod): HTMLElement {
  const header = document.createElement("header");
  header.className = "slip-head";

  const titles = document.createElement("div");
  const kicker = document.createElement("p");
  kicker.className = "slip-kicker";
  kicker.textContent = "Payslip";
  const periodLine = document.createElement("p");
  periodLine.className = "slip-period";
  periodLine.textContent = PERIOD_LABEL[period];
  titles.append(kicker, periodLine);

  const year = document.createElement("p");
  year.className = "slip-year";
  year.textContent = TAX_YEAR_LABEL;

  header.append(titles, year);
  return header;
}

function rows(slip: Payslip): HTMLElement {
  const list = document.createElement("dl");
  list.className = "slip-rows";
  list.append(
    row("Gross pay", slip.gross),
    row("Pension (salary sacrifice)", slip.pension),
    row("Income Tax", slip.incomeTax),
    row("National Insurance", slip.nationalInsurance),
  );
  return list;
}

function row(label: string, amount: number): HTMLElement {
  const line = document.createElement("div");
  const term = document.createElement("dt");
  term.textContent = label;
  const value = document.createElement("dd");
  value.textContent = formatPounds(amount);
  line.append(term, value);
  return line;
}

function takeHome(slip: Payslip): HTMLElement {
  const box = document.createElement("div");
  box.className = "take-home";
  box.append(takeHomeRow("Take-home pay", slip.takeHome, true));
  if (slip.monthlyTakeHome !== null) {
    box.append(takeHomeRow("Take-home per month", slip.monthlyTakeHome, false));
  }
  return box;
}

function takeHomeRow(label: string, amount: number, primary: boolean): HTMLElement {
  const line = document.createElement("div");
  line.className = primary ? "take-home-row" : "take-home-row take-home-month";
  const name = document.createElement("span");
  name.textContent = label;
  const value = document.createElement("strong");
  value.textContent = formatPounds(amount);
  line.append(name, value);
  return line;
}

function equivalentLine(slip: Payslip): HTMLElement {
  const note = document.createElement("p");
  note.className = "annual";
  note.textContent = `About ${formatPounds(slip.annualGross)} a year`;
  return note;
}

function allowanceNote(): HTMLElement {
  const note = document.createElement("p");
  note.className = "allowance-note";
  note.textContent =
    "Earnings over £100,000 usually have a lower tax code, because the personal allowance is reduced. This payslip follows the code you entered.";
  return note;
}

function message(text: string): HTMLElement {
  const paragraph = document.createElement("p");
  paragraph.className = "slip-message";
  paragraph.textContent = text;
  return paragraph;
}
