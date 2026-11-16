import * as React from "react";
import { cn } from "@/lib/utils";

const TONES = {
  default: "text-foreground",
  primary: "text-primary",
  warning: "text-warning",
  danger: "text-destructive",
} as const;

interface StatsCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  hint?: React.ReactNode;
  tone?: keyof typeof TONES;
  /** Makes the card a filter button. */
  onClick?: () => void;
  /** Whether this card's filter is currently applied. */
  active?: boolean;
}

export function StatsCard({ label, value, icon, hint, tone = "default", onClick, active }: StatsCardProps) {
  const body = (
    <>
      <span className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
        <span>{label}</span>
        {icon && <span className="[&_svg]:size-4">{icon}</span>}
      </span>
      <span className={cn("text-2xl font-semibold tracking-tight tabular-nums", TONES[tone])}>{value}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </>
  );
  const base = "flex min-w-0 flex-col gap-1 rounded-xl border bg-card p-4 text-left shadow-xs";

  if (!onClick) return <div className={base}>{body}</div>;
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        base,
        "cursor-pointer outline-none transition-[border-color,box-shadow] hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50",
        active && "border-primary ring-1 ring-primary"
      )}
    >
      {body}
    </button>
  );
}

const COLUMNS = { 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5" } as const;

export function StatsGrid({ columns = 4, children }: { columns?: keyof typeof COLUMNS; children: React.ReactNode }) {
  return <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3", COLUMNS[columns])}>{children}</div>;
}
