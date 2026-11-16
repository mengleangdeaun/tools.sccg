const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/** "$12,450". Purchase prices are stored as USD strings in the sheet. */
export function formatCurrency(value: number): string {
  return currency.format(value);
}
