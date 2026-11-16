"use client";

import React from "react";
import { Asset, AssetStatus } from "@/lib/types";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { ALL_STATUSES, STATUS_CONFIG } from "./asset-status-badge";

interface AssetStatusSelectProps {
  asset: Asset;
  onStatusChange: (asset: Asset, newStatus: AssetStatus) => void;
  className?: string;
  disabled?: boolean;
}

export function AssetStatusSelect({
  asset,
  onStatusChange,
  className,
  disabled,
}: AssetStatusSelectProps) {
  const { can } = useAuth();
  const canEdit = !disabled && can("assets.edit");
  const meta = STATUS_CONFIG[asset.status] || STATUS_CONFIG.Available;

  const options = ALL_STATUSES.map((status) => ({
    value: status,
    label: STATUS_CONFIG[status].label,
    dot: STATUS_CONFIG[status].dot,
  }));

  return (
    <ResponsiveSelect
      aria-label="Asset Status"
      value={asset.status}
      disabled={!canEdit}
      className={className}
      prefix={<span className={cn("size-2 shrink-0 rounded-full", meta.dot)} />}
      toneClassName={cn("rounded-md font-medium shadow-none border", meta.pill)}
      options={options}
      onValueChange={(value) => {
        if (value !== asset.status) {
          onStatusChange(asset, value as AssetStatus);
        }
      }}
    />
  );
}

