"use client";

import React, { useState } from "react";
import { useAssets } from "@/context/assets-context";
import { useIsDesktop } from "@/hooks/use-media-query";
import { Asset } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { PageHeader } from "@/components/shared/page-header";
import { DataColumn, DataTable } from "@/components/shared/data-table";
import { CardList } from "@/components/shared/card-list";
import { ActionButton } from "@/components/shared/action-button";
import { NoResults } from "@/components/shared/empty-state";
import { Printer, QrCode, Search } from "lucide-react";
import { AssetStatusBadge } from "@/features/assets/components/asset-status-badge";

export function QrStudioView() {
  const {
    assets,
    categories,
    selectedForPrint,
    toggleSelectForPrint,
    selectAllForPrint,
    clearSelectForPrint,
    openPrintModal,
  } = useAssets();

  const isDesktop = useIsDesktop();
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");

  const filtered = assets.filter((a) => {
    const matchesSearch =
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.tag_code.toLowerCase().includes(search.toLowerCase()) ||
      (a.serial_number && a.serial_number.toLowerCase().includes(search.toLowerCase()));

    const matchesCat = selectedCat === "All" || a.category_id === selectedCat;
    return matchesSearch && matchesCat;
  });

  const isSelected = (asset: Asset) => selectedForPrint.some((s) => s.id === asset.id);
  const allSelected = filtered.length > 0 && filtered.every(isSelected);
  const toggleAll = () => (allSelected ? clearSelectForPrint() : selectAllForPrint(filtered));
  const categoryName = (asset: Asset) => categories.find((c) => c.id === asset.category_id)?.name || "General";
  const selectBox = (asset: Asset) => (
    <Checkbox aria-label={`Select ${asset.tag_code}`} checked={isSelected(asset)} onCheckedChange={() => toggleSelectForPrint(asset)} />
  );
  const printOne = (asset: Asset, showLabel?: boolean) => (
    <ActionButton
      icon={<Printer />}
      label="Print label"
      showLabel={showLabel}
      variant={showLabel ? "outline" : "ghost"}
      onClick={() => openPrintModal([asset], "single")}
    />
  );
  const resetFilters = () => {
    setSearch("");
    setSelectedCat("All");
  };
  const empty = <NoResults onClear={resetFilters} />;

  const columns: DataColumn<Asset>[] = [
    {
      key: "select",
      header: <Checkbox aria-label={allSelected ? "Deselect all" : "Select all"} checked={allSelected} onCheckedChange={toggleAll} />,
      className: "w-10",
      interactive: true,
      cell: selectBox,
    },
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
    {
      key: "serial",
      header: "Serial number",
      className: "w-44",
      cell: (a) => <span className="font-mono text-xs text-muted-foreground">{a.serial_number || "—"}</span>,
    },
    { key: "category", header: "Category", className: "w-36", cell: (a) => <span className="text-muted-foreground">{categoryName(a)}</span> },
    { key: "status", header: "Status", className: "w-36", cell: (a) => <AssetStatusBadge status={a.status} /> },
    {
      key: "print",
      header: <span className="sr-only">Print</span>,
      className: "w-16",
      align: "right",
      interactive: true,
      cell: (a) => printOne(a),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="QR label studio"
        description="Print asset labels on thermal rolls or standard sticker sheets."
        actions={
          <>
            <Button size="sm" variant="outline" disabled={selectedForPrint.length === 0} onClick={() => openPrintModal(selectedForPrint, "single")}>
              <Printer />
              Thermal labels ({selectedForPrint.length})
            </Button>
            <Button size="sm" disabled={selectedForPrint.length === 0} onClick={() => openPrintModal(selectedForPrint, "sheet")}>
              <QrCode />
              4 per page ({selectedForPrint.length})
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Filter assets to print"
            placeholder="Filter assets to print..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9 md:h-8"
          />
        </div>
        <div className="w-48">
          <SearchableSelect
            aria-label="Category"
            searchPlaceholder="Search categories"
            value={selectedCat}
            onValueChange={setSelectedCat}
            options={[{ value: "All", label: "All categories" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
            className="h-10 w-full md:h-8"
          />
        </div>
        <Button size="sm" variant="ghost" onClick={toggleAll} disabled={filtered.length === 0} className="h-10 md:h-8">
          {allSelected ? "Deselect all" : "Select all"}
        </Button>
      </div>

      {isDesktop ? (
        <DataTable columns={columns} rows={filtered} getRowKey={(a) => a.id} onRowClick={toggleSelectForPrint} empty={empty} />
      ) : (
        <CardList
          rows={filtered}
          getRowKey={(a) => a.id}
          empty={empty}
          renderCard={(asset) => (
            <Card className="h-full gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-0.5">
                  <p className="font-semibold text-foreground">{asset.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{asset.tag_code}</p>
                </div>
                {selectBox(asset)}
              </div>
              <div className="flex items-center justify-between gap-2">
                <AssetStatusBadge status={asset.status} />
                <span className="min-w-0 truncate text-sm text-muted-foreground" title={categoryName(asset)}>{categoryName(asset)}</span>
              </div>
              <div className="mt-auto">{printOne(asset, true)}</div>
            </Card>
          )}
        />
      )}
    </div>
  );
}
