# UK take-home pay

A payslip estimate for employees in England, Wales, and Northern Ireland. Enter a gross salary, a tax code, and a pension percentage, and the page shows Income Tax, employee National Insurance, and take-home pay for the 2026/27 tax year (6 April 2026 to 5 April 2027).

The figure you enter is the gross pay for the period you choose: a week, a month, or a year. An annual salary also shows take-home pay per month.

## Run it

```bash
npm install
npm run dev
```

Vite prints a local address. Open that in a browser.

`npm test` runs the payslip calculations. `npm run build` typechecks the project and writes a static site to `dist/`.

## Payslip

The pension is treated as salary sacrifice: the percentage comes off gross pay before Income Tax and National Insurance. Take-home pay is what remains after pension, tax, and National Insurance.

Rates are for employee National Insurance category A. Student loans are not included. The figures are in [`src/tax/rates.ts`](src/tax/rates.ts), taken from [HMRC’s 2026 to 2027 employer rates](https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027).

Income Tax, above the allowance in the tax code:

| Taxable pay | Rate |
| --- | --- |
| Up to £37,700 | 20% |
| £37,701 to £125,140 | 40% |
| Above £125,140 | 45% |

Tax is worked out as if this pay continues for the whole year, then split back across the week, month, or year. National Insurance uses the published threshold for that period. A real payroll can differ by a few pence because of HMRC rounding.

## Tax codes

The tax code field starts at `1257L`, the standard allowance of £12,570. Codes are not case-sensitive. A `C` prefix (Wales) uses the same bands. A non-cumulative suffix (`W1`, `M1`, or `X`) is accepted and does not change this estimate, because the salary is assumed to be the same every period.

| Code | Effect |
| --- | --- |
| `1257L`, and other `L`, `M`, `N`, or `T` codes | Allowance is the number times 10 |
| `K` codes | That amount is added to taxable pay. Tax in the period is capped at half of pay after pension |
| `0T` | No allowance, then the usual bands |
| `BR` | All pay at 20% |
| `D0` | All pay at 40% |
| `D1` | All pay at 45% |
| `NT` | No Income Tax |

Scottish codes, which start with `S`, are rejected. Scotland has different Income Tax bands.

The personal allowance usually shrinks once income is over £100,000. This calculator follows the tax code you type and does not apply that reduction itself. Above that income, with a code that still grants an allowance, the payslip notes that HMRC would usually issue a lower code.
