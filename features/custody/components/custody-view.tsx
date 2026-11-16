"use client";

import React, { useState } from "react";
import { ArrowDownLeft, Search, UserCheck } from "lucide-react";
import { useAssets } from "@/context/assets-context";
import { useIsDesktop } from "@/hooks/use-media-query";
import { Asset } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { DataColumn, DataTable } from "@/components/shared/data-table";
import { CardList } from "@/components/shared/card-list";
import { ActionButton } from "@/components/shared/action-button";
import { EmptyState, NoResults } from "@/components/shared/empty-state";
import { formatDisplayDate, isPastDate } from "@/lib/date-utils";

function ReturnDate({ asset }: { asset: Asset }) {
  if (!asset.expected_return) return <span className="text-muted-foreground">—</span>;
  const overdue = isPastDate(asset.expected_return);
  return (
    <span className={overdue ? "font-medium text-destructive" : "text-muted-foreground"}>
      {formatDisplayDate(asset.expected_return)}
      {overdue && " (overdue)"}
    </span>
  );
}

export function CustodyView() {
  const { assets, openCheckinModal, openDetailDrawer } = useAssets();
  const isDesktop = useIsDesktop();
  const [search, setSearch] = useState("");

  const q = search.trim().toLowerCase();
  const assignedAssets = assets
    .filter((a) => a.status === "Assigned")
    .filter(
      (a) =>
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.tag_code.toLowerCase().includes(q) ||
        (a.custodian_email || "").toLowerCase().includes(q)
    );

  const empty = q ? (
    <NoResults onClear={() => setSearch("")} description="No checked-out assets match your search." />
  ) : (
    <EmptyState
      icon={<UserCheck />}
      title="No assets checked out"
      description="All equipment is in stock. Use Check out in the inventory when handing a device to someone."
    />
  );

  const returnAction = (asset: Asset, showLabel?: boolean) => (
    <ActionButton variant="outline" icon={<ArrowDownLeft />} label="Check in" showLabel={showLabel} onClick={() => openCheckinModal(asset)} />
  );

  const columns: DataColumn<Asset>[] = [
    {
      key: "asset",
      header: "Asset",
      cell: (asset) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-foreground">{asset.name}</span>
          <span className="font-mono text-xs text-muted-foreground">{asset.tag_code}</span>
        </div>
      ),
    },
    { key: "custodian", header: "Custodian", className: "w-56", cell: (asset) => <span className="text-foreground">{asset.custodian_email}</span> },
    { key: "department", header: "Department", className: "w-36", cell: (asset) => <span className="text-muted-foreground">{asset.department || "—"}</span> },
    { key: "assigned", header: "Assigned", className: "w-32", cell: (asset) => <span className="text-muted-foreground">{formatDisplayDate(asset.assigned_date)}</span> },
    { key: "return", header: "Expected return", className: "w-40", cell: (asset) => <ReturnDate asset={asset} /> },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "w-16",
      align: "right",
      interactive: true,
      cell: (asset) => returnAction(asset),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Custody & handover"
        description={`${assignedAssets.length} asset${assignedAssets.length === 1 ? "" : "s"} currently with employees.`}
      />

      <div className="relative w-full sm:w-72">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Search employee or asset"
          placeholder="Search employee or asset..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 pl-9 md:h-8"
        />
      </div>

      {isDesktop ? (
        <DataTable columns={columns} rows={assignedAssets} getRowKey={(a) => a.id} onRowClick={openDetailDrawer} empty={empty} />
      ) : (
        <CardList
          rows={assignedAssets}
          getRowKey={(a) => a.id}
          empty={empty}
          renderCard={(asset) => (
            <Card className="h-full gap-3 p-4">
              <button type="button" onClick={() => openDetailDrawer(asset)} className="space-y-0.5 text-left outline-none focus-visible:underline">
                <p className="font-semibold text-foreground">{asset.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{asset.tag_code}</p>
              </button>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <dt className="text-muted-foreground">Custodian</dt>
                <dd className="truncate text-right text-foreground" title={asset.custodian_email}>{asset.custodian_email}</dd>
                <dt className="text-muted-foreground">Assigned</dt>
                <dd className="text-right text-foreground">{formatDisplayDate(asset.assigned_date)}</dd>
                <dt className="text-muted-foreground">Return</dt>
                <dd className="text-right">
                  <ReturnDate asset={asset} />
                </dd>
              </dl>
              <div className="mt-auto">{returnAction(asset, true)}</div>
            </Card>
          )}
        />
      )}
    </div>
  );
}
