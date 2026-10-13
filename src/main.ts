import { renderPayslip, type FormValues } from "./ui";
import type { PayPeriod } from "./tax/rates";
import "./styles.css";

const form = document.querySelector<HTMLFormElement>("#pay-form");
const payslip = document.querySelector<HTMLElement>("#payslip");
const gross = document.querySelector<HTMLInputElement>("#gross");
const taxCode = document.querySelector<HTMLInputElement>("#tax-code");
const pension = document.querySelector<HTMLInputElement>("#pension");

if (!form || !payslip || !gross || !taxCode || !pension) {
  throw new Error("Payslip form is missing from the page.");
}

form.addEventListener("submit", (event) => event.preventDefault());
form.addEventListener("input", draw);
draw();

function draw(): void {
  renderPayslip(payslip!, readForm());
}

function isPayPeriod(value: string | undefined): value is PayPeriod {
  return value === "weekly" || value === "monthly" || value === "annual";
}

function readForm(): FormValues {
  const selected = form!.querySelector<HTMLInputElement>('input[name="period"]:checked');
  const period: PayPeriod = isPayPeriod(selected?.value) ? selected.value : "monthly";
  return {
    gross: gross!.value,
    period,
    taxCode: taxCode!.value,
    pension: pension!.value,
  };
}
