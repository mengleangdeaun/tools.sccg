import * as React from "react";
import { Card } from "@/components/ui/card";

interface CardListProps<T> {
  rows: T[];
  getRowKey: (row: T) => string;
  renderCard: (row: T) => React.ReactNode;
  empty?: React.ReactNode;
}

// One column on phones, two on tablets. Pair with DataTable and pick between them with useIsDesktop().
export function CardList<T>({ rows, getRowKey, renderCard, empty = "Nothing to show." }: CardListProps<T>) {
  if (rows.length === 0) {
    return <Card className="p-0 text-sm text-muted-foreground">{empty}</Card>;
  }
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {rows.map((row) => (
        <li key={getRowKey(row)} className="min-w-0">
          {renderCard(row)}
        </li>
      ))}
    </ul>
  );
}
