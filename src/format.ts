const pounds = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

export function formatPounds(amount: number): string {
  return pounds.format(amount);
}
