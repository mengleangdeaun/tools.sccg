export const MAX_BULK = 100;

// Serial numbers for a bulk registration, one per line. Blank lines are ignored; either no serials
// or exactly one per item is valid.
export function normalizeSerials(input: string | string[], quantity: number) {
  const lines = Array.isArray(input) ? input : input.split(/\r?\n/);
  const serials = lines.map((s) => String(s).trim()).filter(Boolean);
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const s of serials) {
    const key = s.toLowerCase();
    if (seen.has(key)) dup.add(s);
    else seen.add(key);
  }
  const duplicates = [...dup];

  let error: string | null = null;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_BULK) error = `Quantity must be 1–${MAX_BULK}.`;
  else if (serials.length > 0 && serials.length !== quantity)
    error = `Enter ${quantity} serial number${quantity === 1 ? "" : "s"} (one per line) or none — got ${serials.length}.`;
  else if (duplicates.length > 0) error = `Duplicate serial number${duplicates.length === 1 ? "" : "s"}: ${duplicates.join(", ")}.`;

  return { serials, duplicates, error };
}
