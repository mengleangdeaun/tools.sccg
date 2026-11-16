// Pure page math for lists. No runtime imports, so `node --test` can load it.

export const PAGE_SIZES = [10, 25, 50] as const;

export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

// Keeps the page inside the list when filtering shrinks it.
export function clampPage(page: number, total: number, pageSize: number): number {
  return Math.min(Math.max(1, page), pageCount(total, pageSize));
}

// Page numbers to show: always the first and last, the current page and its neighbours, "…" for gaps.
export function pageWindow(page: number, count: number): (number | "…")[] {
  const shown = [...new Set([1, count, page - 1, page, page + 1])]
    .filter((n) => n >= 1 && n <= count)
    .sort((a, b) => a - b);
  return shown.flatMap((n, i) => {
    const gap = i > 0 ? n - shown[i - 1] : 1;
    // A gap of one page shows that page instead of "…", which would take the same room.
    if (gap === 2) return [n - 1, n];
    return gap > 2 ? (["…", n] as const) : [n];
  });
}

export function pageSlice<T>(rows: T[], page: number, pageSize: number): T[] {
  const start = (clampPage(page, rows.length, pageSize) - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}
