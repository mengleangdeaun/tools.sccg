"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { PAGE_SIZES, pageCount, pageWindow } from "@/lib/pagination";

interface DataPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

// Page numbers from tablet size up; a compact "Page 2 of 6" on phones.
export function DataPagination({ page, pageSize, total, onPageChange, onPageSizeChange }: DataPaginationProps) {
  const isMobile = useIsMobile();
  const count = pageCount(total, pageSize);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const navButton = "h-11 w-11 md:h-8 md:w-8";

  return (
    <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <div className="flex items-center gap-3">
        <span aria-live="polite">
          {total === 0 ? "No results" : `Showing ${from}–${to} of ${total}`}
        </span>
        <div className="flex items-center gap-2">
          <span>Rows</span>
          <div className="w-20">
            <ResponsiveSelect
              aria-label="Rows per page"
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
              options={PAGE_SIZES.map((size: number) => ({ value: String(size), label: String(size) }))}
              className="h-8 w-full"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={navButton}
        >
          <ChevronLeftIcon />
        </Button>
        {isMobile ? (
          <span className="px-2 text-foreground">
            Page {page} of {count}
          </span>
        ) : (
          pageWindow(page, count).map((n: number | "…", i: number) =>
            n === "…" ? (
              <span key={`gap-${i}`} aria-hidden className="px-1">
                …
              </span>
            ) : (
              <Button
                key={n}
                variant={n === page ? "outline" : "ghost"}
                aria-label={`Page ${n}`}
                aria-current={n === page ? "page" : undefined}
                onClick={() => onPageChange(n)}
                className={cn("h-8 min-w-8 px-2", n === page && "font-semibold text-foreground")}
              >
                {n}
              </Button>
            )
          )
        )}
        <Button
          variant="outline"
          size="icon"
          aria-label="Next page"
          disabled={page >= count}
          onClick={() => onPageChange(page + 1)}
          className={navButton}
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </nav>
  );
}
