"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { AssetStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Single source for status colors: badge, select and anything else that shows a status. */
export const STATUS_CONFIG: Record<AssetStatus, { label: string; dot: string; pill: string }> = {
  Available: { label: "Available", dot: "bg-success", pill: "bg-success/10 text-success border-success/20" },
  Assigned: { label: "Assigned", dot: "bg-info", pill: "bg-info/10 text-info border-info/20" },
  Maintenance: { label: "Maintenance", dot: "bg-warning", pill: "bg-warning/10 text-warning border-warning/20" },
  Reserved: { label: "Reserved", dot: "bg-reserved", pill: "bg-reserved/10 text-reserved border-reserved/20" },
  Retired: { label: "Retired", dot: "bg-muted-foreground", pill: "bg-muted text-muted-foreground border-border" },
  Lost: { label: "Lost / Missing", dot: "bg-destructive", pill: "bg-destructive/10 text-destructive border-destructive/20" },
};

export const ALL_STATUSES = Object.keys(STATUS_CONFIG) as AssetStatus[];

interface AssetStatusBadgeProps {
  status: AssetStatus | string;
  className?: string;
}

export function AssetStatusBadge({ status, className }: AssetStatusBadgeProps) {
  const config = STATUS_CONFIG[status as AssetStatus] ?? {
    label: status,
    pill: "bg-muted text-muted-foreground border-border",
  };

  return (
    <Badge variant="outline" className={cn("rounded-full border px-2 text-xs font-medium", config.pill, className)}>
      <span aria-hidden className="mr-0.5 size-1.5 rounded-full bg-current" />
      {config.label}
    </Badge>
  );
}
