"use client";

import React, { useState } from "react";
import { Wrench } from "lucide-react";
import { useAssets } from "@/context/assets-context";
import { useIsDesktop } from "@/hooks/use-media-query";
import { AssetMaintenance } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { PageHeader } from "@/components/shared/page-header";
import { DataColumn, DataTable } from "@/components/shared/data-table";
import { CardList } from "@/components/shared/card-list";
import { EmptyState, NoResults } from "@/components/shared/empty-state";
import { formatDisplayDate } from "@/lib/date-utils";
import { formatCurrency } from "@/lib/format";

type Filter = "all" | "in_progress" | "completed";

function ServiceStatus({ status }: { status: string }) {
  return status === "completed" ? (
    <Badge variant="outline" className="border-success/20 bg-success/10 text-success">Completed</Badge>
  ) : (
    <Badge variant="outline" className="border-warning/20 bg-warning/10 text-warning">In progress</Badge>
  );
}

const cost = (record: AssetMaintenance) => parseFloat(record.cost) || 0;

export function MaintenanceView() {
  const { maintenance, assets, openDetailDrawer } = useAssets();
  const isDesktop = useIsDesktop();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = maintenance.filter((m) => filter === "all" || m.status === filter);
  const totalCost = filtered.reduce((sum, m) => sum + cost(m), 0);

  const assetOf = (record: AssetMaintenance) => assets.find((a) => a.id === record.asset_id);
  const openRecord = (record: AssetMaintenance) => {
    const asset = assetOf(record);
    if (asset) openDetailDrawer(asset, "maintenance");
  };

  const assetLabel = (record: AssetMaintenance) => {
    const asset = assetOf(record);
    return (
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-foreground">{asset?.name ?? record.asset_id}</span>
        {asset && <span className="font-mono text-xs text-muted-foreground">{asset.tag_code}</span>}
      </div>
    );
  };

  const empty =
    filter !== "all" ? (
      <NoResults onClear={() => setFilter("all")} description="No service tickets with this status." />
    ) : (
      <EmptyState icon={<Wrench />} title="No maintenance records" description="No repairs or services have been logged yet." />
    );

  const columns: DataColumn<AssetMaintenance>[] = [
    { key: "asset", header: "Asset", cell: assetLabel },
    { key: "type", header: "Service type", className: "w-40", cell: (r) => r.service_type },
    { key: "vendor", header: "Vendor", className: "w-36", cell: (r) => <span className="text-muted-foreground">{r.vendor || "Internal IT"}</span> },
    { key: "started", header: "Started", className: "w-32", cell: (r) => <span className="text-muted-foreground">{formatDisplayDate(r.started_at)}</span> },
    { key: "status", header: "Status", className: "w-32", cell: (r) => <ServiceStatus status={r.status} /> },
    { key: "cost", header: "Cost", className: "w-28", align: "right", cell: (r) => <span className="font-medium text-foreground">{formatCurrency(cost(r))}</span> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Maintenance & repairs"
        description={`${filtered.length} service ticket${filtered.length === 1 ? "" : "s"} · ${formatCurrency(totalCost)} total cost`}
        actions={
          <div className="w-48">
            <ResponsiveSelect
              aria-label="Filter by status"
              value={filter}
              onValueChange={(val) => setFilter(val as Filter)}
              options={[
                { value: "all", label: "All tickets" },
                { value: "in_progress", label: "In progress" },
                { value: "completed", label: "Completed" },
              ]}
              className="h-10 w-full md:h-8"
            />
          </div>
        }
      />

      {isDesktop ? (
        <DataTable columns={columns} rows={filtered} getRowKey={(r) => r.id} onRowClick={openRecord} empty={empty} />
      ) : (
        <CardList
          rows={filtered}
          getRowKey={(r) => r.id}
          empty={empty}
          renderCard={(record) => (
            <Card className="h-full gap-3 p-4">
              <button type="button" onClick={() => openRecord(record)} className="text-left outline-none focus-visible:underline">
                {assetLabel(record)}
              </button>
              <div className="flex items-center justify-between gap-2">
                <ServiceStatus status={record.status} />
                <span className="font-medium tabular-nums text-foreground">{formatCurrency(cost(record))}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {record.service_type} · {record.vendor || "Internal IT"} · {formatDisplayDate(record.started_at)}
              </p>
            </Card>
          )}
        />
      )}
    </div>
  );
}
