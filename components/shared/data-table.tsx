"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface DataColumn<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  /** Width and any extra styling, e.g. "w-40". Leave one column without a width so it takes the rest. */
  className?: string;
  align?: "left" | "right";
  /** Holds its own controls, so clicks there do not also open the row. */
  interactive?: boolean;
}

interface DataTableProps<T> {
  columns: DataColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: React.ReactNode;
}

// Fixed layout with wrapping cells, so the table fits its container instead of scrolling sideways.
export function DataTable<T>({ columns, rows, getRowKey, onRowClick, empty = "Nothing to show." }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table className="table-fixed">
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn("px-3 text-xs text-muted-foreground", column.align === "right" && "text-right", column.className)}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="p-0 text-center whitespace-normal text-muted-foreground">
                {empty}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={getRowKey(row)}
                onClick={onRowClick && (() => onRowClick(row))}
                // Rows that open something are reachable and operable from the keyboard.
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick &&
                  ((e) => {
                    if (e.target !== e.currentTarget || (e.key !== "Enter" && e.key !== " ")) return;
                    e.preventDefault();
                    onRowClick(row);
                  })
                }
                className={cn(
                  onRowClick &&
                    "cursor-pointer outline-none focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
                )}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    onClick={column.interactive ? (e) => e.stopPropagation() : undefined}
                    className={cn(
                      "px-3 py-3 align-top whitespace-normal break-words",
                      column.align === "right" && "text-right",
                      column.interactive && "cursor-default"
                    )}
                  >
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
