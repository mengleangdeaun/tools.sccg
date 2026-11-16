"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { AssetCondition } from "@/lib/types";
import { cn } from "@/lib/utils";

const CONDITION_CONFIG: Record<string, string> = {
  "Brand New": "bg-success/10 text-success border-success/20",
  Good: "bg-info/10 text-info border-info/20",
  Fair: "bg-warning/10 text-warning border-warning/20",
  Damaged: "bg-destructive/10 text-destructive border-destructive/20",
};

interface AssetConditionBadgeProps {
  condition: AssetCondition | string;
  className?: string;
}

export function AssetConditionBadge({ condition, className }: AssetConditionBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md border px-2 text-xs font-normal",
        CONDITION_CONFIG[condition] ?? "bg-muted text-muted-foreground border-border",
        className
      )}
    >
      {condition || "Unknown"}
    </Badge>
  );
}
