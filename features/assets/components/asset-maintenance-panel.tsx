"use client";

import React from "react";
import { Asset, AssetMaintenance } from "@/lib/types";
import { useAssets } from "@/context/assets-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDisplayDate } from "@/lib/date-utils";
import { Wrench, Plus, CheckCircle, Clock } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

interface AssetMaintenancePanelProps {
  asset: Asset;
}

export function AssetMaintenancePanel({ asset }: AssetMaintenancePanelProps) {
  const { maintenance, openMaintenanceModal } = useAssets();
  const records = maintenance.filter((m) => m.asset_id === asset.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Service & repairs</h3>
          <p className="text-xs text-muted-foreground">
            {records.length} record{records.length === 1 ? "" : "s"} logged
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => openMaintenanceModal(asset)}
          className="gap-1.5"
        >
          <Plus className="size-3" />
          Log Service
        </Button>
      </div>

      {records.length === 0 ? (
        <EmptyState
          size="sm"
          icon={<Wrench className="size-4" />}
          title="No service records"
          description="Past repairs, preventive maintenance, and upgrades will show here."
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => openMaintenanceModal(asset)}
              className="h-8"
            >
              Log First Service
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div key={record.id} className="border rounded-lg p-3 bg-card/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {record.service_type}
                  </span>
                  {record.status === "completed" ? (
                    <Badge variant="outline" className="border-success/20 bg-success/10 text-success">
                      Completed
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-warning/20 bg-warning/10 text-warning">
                      In Progress
                    </Badge>
                  )}
                </div>
                <span className="text-sm font-medium tabular-nums text-foreground">
                  ${record.cost || "0"}
                </span>
              </div>

              {record.notes && (
                <p className="text-sm leading-relaxed text-muted-foreground">{record.notes}</p>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                <span>Vendor: <strong>{record.vendor || "Internal IT"}</strong></span>
                <span>{formatDisplayDate(record.started_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

