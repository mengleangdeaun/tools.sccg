"use client";

import React, { useMemo, useState } from "react";
import { ArrowDownLeft, Boxes, Grid, List, Plus, Printer, QrCode, UserCheck } from "lucide-react";
import { Asset } from "@/lib/types";
import { useAssets } from "@/context/assets-context";
import { useAuth } from "@/context/auth-context";
import { useIsDesktop } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar, FilterChip, FilterField } from "@/components/shared/filter-bar";
import { DataColumn, DataTable } from "@/components/shared/data-table";
import { CardList } from "@/components/shared/card-list";
import { DataPagination } from "@/components/shared/data-pagination";
import { ActionButton } from "@/components/shared/action-button";
import { NoData, NoResults } from "@/components/shared/empty-state";
import { PAGE_SIZES, clampPage, pageSlice } from "@/lib/pagination";
import { setUrlParam } from "@/lib/url-params";
import { ALL_STATUSES, AssetStatusBadge, STATUS_CONFIG } from "./asset-status-badge";
import { AssetStatusSelect } from "./asset-status-select";
import { AssetConditionBadge } from "./asset-condition-badge";

const ALL = "All";

// The dashboard links here with ?status= / ?category=; the URL keeps filters across reloads.
function initialParam(name: string): string {
  if (typeof window === "undefined") return ALL;
  return new URLSearchParams(window.location.search).get(name) || ALL;
}

export function AssetInventoryView() {
  const {
    assets,
    categories,
    locations,
    openDetailDrawer,
    openAssetModal,
    openCheckoutModal,
    openCheckinModal,
    openPrintModal,
    selectedForPrint,
    toggleSelectForPrint,
    selectAllForPrint,
    clearSelectForPrint,
    onSaveAsset,
  } = useAssets();

  const { can } = useAuth();
  const isDesktop = useIsDesktop();
  const [search, setSearch] = useState("");
  const [status, setStatusState] = useState(() => initialParam("status"));
  const [category, setCategoryState] = useState(() => initialParam("category"));
  const [location, setLocationState] = useState(ALL);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[1]);

  const setStatus = (value: string) => {
    setStatusState(value);
    setUrlParam("status", value === ALL ? null : value);
  };
  const setCategory = (value: string) => {
    setCategoryState(value);
    setUrlParam("category", value === ALL ? null : value);
  };

  const filteredAssets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((asset) => {
      const matchesSearch =
        !q ||
        asset.name.toLowerCase().includes(q) ||
        asset.tag_code.toLowerCase().includes(q) ||
        (asset.serial_number && asset.serial_number.toLowerCase().includes(q)) ||
        (asset.custodian_email && asset.custodian_email.toLowerCase().includes(q));

      return (
        matchesSearch &&
        (status === ALL || asset.status === status) &&
        (category === ALL || asset.category_id === category) &&
        (location === ALL || asset.location_id === location)
      );
    });
  }, [assets, search, status, category, location]);

  const currentPage = clampPage(page, filteredAssets.length, pageSize);
  const pageRows = pageSlice(filteredAssets, currentPage, pageSize);

  const isSelected = (asset: Asset) => selectedForPrint.some((s) => s.id === asset.id);
  const allSelected = filteredAssets.length > 0 && filteredAssets.every(isSelected);

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name || "General";
  const getLocationName = (id: string) => locations.find((l) => l.id === id)?.name || "—";

  const statusOptions = [{ value: ALL, label: "All statuses" }, ...ALL_STATUSES.map((s) => ({ value: s, label: STATUS_CONFIG[s].label }))];
  const categoryOptions = [{ value: ALL, label: "All categories" }, ...categories.map((c) => ({ value: c.id, label: c.name }))];
  const locationOptions = [{ value: ALL, label: "All locations" }, ...locations.map((l) => ({ value: l.id, label: l.name }))];

  const chips: FilterChip[] = [
    status !== ALL && { key: "status", text: `Status: ${STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label ?? status}`, clear: () => setStatus(ALL) },
    category !== ALL && { key: "category", text: `Category: ${getCategoryName(category)}`, clear: () => setCategory(ALL) },
    location !== ALL && { key: "location", text: `Location: ${getLocationName(location)}`, clear: () => setLocationState(ALL) },
  ].filter((chip): chip is FilterChip => Boolean(chip));

  const clearPanel = () => {
    setStatus(ALL);
    setCategory(ALL);
    setLocationState(ALL);
  };
  const resetFilters = () => {
    clearPanel();
    setSearch("");
  };

  const empty =
    assets.length === 0 ? (
      <NoData
        icon={<Boxes />}
        title="No assets registered"
        description="Your hardware and equipment inventory is empty. Add your first asset to start tracking."
        action={
          can("assets.create") ? (
            <Button size="sm" onClick={() => openAssetModal()}>
              <Plus />
              Add first asset
            </Button>
          ) : undefined
        }
      />
    ) : (
      <NoResults onClear={resetFilters} />
    );

  const custodyAction = (asset: Asset, showLabel?: boolean) => {
    if (!can("assets.custody")) return null;
    if (asset.status === "Available")
      return <ActionButton variant="outline" icon={<UserCheck />} label="Check out" showLabel={showLabel} onClick={() => openCheckoutModal(asset)} />;
    if (asset.status === "Assigned")
      return <ActionButton variant="outline" icon={<ArrowDownLeft />} label="Return" showLabel={showLabel} onClick={() => openCheckinModal(asset)} />;
    return null;
  };

  const columns: DataColumn<Asset>[] = [
    {
      key: "select",
      header: (
        <Checkbox
          aria-label={allSelected ? "Deselect all for printing" : "Select all for printing"}
          checked={allSelected}
          onCheckedChange={() => (allSelected ? clearSelectForPrint() : selectAllForPrint(filteredAssets))}
        />
      ),
      className: "w-10",
      interactive: true,
      cell: (asset) => (
        <Checkbox aria-label={`Select ${asset.tag_code} for printing`} checked={isSelected(asset)} onCheckedChange={() => toggleSelectForPrint(asset)} />
      ),
    },
    {
      key: "asset",
      header: "Asset",
      cell: (asset) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-foreground">{asset.name}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {asset.tag_code}
            {asset.serial_number && ` · S/N ${asset.serial_number}`}
          </span>
        </div>
      ),
    },
    { key: "category", header: "Category", className: "w-36", cell: (asset) => <span className="text-muted-foreground">{getCategoryName(asset.category_id)}</span> },
    {
      key: "status",
      header: "Status",
      className: "w-44",
      interactive: true,
      cell: (asset) => (
        <AssetStatusSelect asset={asset} onStatusChange={(item, newStatus) => onSaveAsset({ id: item.id, status: newStatus })} className="h-8 w-full" />
      ),
    },
    { key: "condition", header: "Condition", className: "w-28", cell: (asset) => <AssetConditionBadge condition={asset.condition} /> },
    {
      key: "custodian",
      header: "Custodian",
      className: "w-52",
      cell: (asset) =>
        asset.custodian_email ? (
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-foreground">{asset.custodian_email}</span>
            {asset.department && <span className="text-xs text-muted-foreground">{asset.department}</span>}
          </div>
        ) : (
          <span className="text-muted-foreground">In stock</span>
        ),
    },
    { key: "location", header: "Location", className: "w-36", cell: (asset) => <span className="text-muted-foreground">{getLocationName(asset.location_id)}</span> },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "w-28",
      align: "right",
      interactive: true,
      cell: (asset) => (
        <div className="flex items-center justify-end gap-1">
          {can("assets.print") && <ActionButton icon={<QrCode />} label="Print QR label" onClick={() => openPrintModal([asset], "single")} />}
          {custodyAction(asset)}
        </div>
      ),
    },
  ];

  const renderCard = (asset: Asset) => (
    <Card className="h-full gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={() => openDetailDrawer(asset)} className="min-w-0 space-y-0.5 text-left outline-none focus-visible:underline">
          <p className="line-clamp-2 font-semibold text-foreground">{asset.name}</p>
          <p className="font-mono text-xs text-muted-foreground">{asset.tag_code}</p>
        </button>
        <Checkbox aria-label={`Select ${asset.tag_code} for printing`} checked={isSelected(asset)} onCheckedChange={() => toggleSelectForPrint(asset)} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <AssetStatusBadge status={asset.status} />
        <AssetConditionBadge condition={asset.condition} />
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted-foreground">Custodian</dt>
        <dd className="truncate text-right text-foreground" title={asset.custodian_email || undefined}>{asset.custodian_email || "In stock"}</dd>
        <dt className="text-muted-foreground">Location</dt>
        <dd className="truncate text-right text-foreground" title={getLocationName(asset.location_id)}>{getLocationName(asset.location_id)}</dd>
      </dl>
      <div className="mt-auto flex flex-wrap gap-2">
        {can("assets.print") && <ActionButton variant="outline" icon={<QrCode />} label="Print label" showLabel onClick={() => openPrintModal([asset], "single")} />}
        {custodyAction(asset, true)}
      </div>
    </Card>
  );

  const showTable = isDesktop && viewMode === "table";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Asset inventory"
        description={`${assets.length} assets registered across ${locations.length} locations.`}
        actions={
          <>
            {selectedForPrint.length > 0 && (
              <Button size="sm" variant="outline" onClick={() => openPrintModal(selectedForPrint, "sheet")}>
                <Printer className="text-primary" />
                Print labels ({selectedForPrint.length})
              </Button>
            )}
            {can("assets.create") && (
              <Button size="sm" onClick={() => openAssetModal()}>
                <Plus />
                Add asset
              </Button>
            )}
          </>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search tag, name, serial, custodian..."
        chips={chips}
        onClearPanel={clearPanel}
        hasActiveFilters={chips.length > 0 || Boolean(search.trim())}
        onReset={resetFilters}
        panel={
          <>
            <FilterField label="Status">
              <ResponsiveSelect aria-label="Status" value={status} onValueChange={setStatus} options={statusOptions} />
            </FilterField>
            <FilterField label="Category">
              <ResponsiveSelect aria-label="Category" value={category} onValueChange={setCategory} options={categoryOptions} />
            </FilterField>
            <FilterField label="Location">
              <ResponsiveSelect aria-label="Location" value={location} onValueChange={setLocationState} options={locationOptions} />
            </FilterField>
          </>
        }
        trailing={
          isDesktop && (
            <div role="group" aria-label="Layout" className="flex rounded-md border bg-muted/40 p-0.5">
              <Button size="icon-sm" variant={viewMode === "table" ? "secondary" : "ghost"} aria-label="Table view" aria-pressed={viewMode === "table"} onClick={() => setViewMode("table")} className="size-7">
                <List />
              </Button>
              <Button size="icon-sm" variant={viewMode === "grid" ? "secondary" : "ghost"} aria-label="Card view" aria-pressed={viewMode === "grid"} onClick={() => setViewMode("grid")} className="size-7">
                <Grid />
              </Button>
            </div>
          )
        }
      />

      {showTable ? (
        <DataTable columns={columns} rows={pageRows} getRowKey={(a) => a.id} onRowClick={openDetailDrawer} empty={empty} />
      ) : (
        <CardList rows={pageRows} getRowKey={(a) => a.id} renderCard={renderCard} empty={empty} />
      )}

      {filteredAssets.length > 0 && (
        <DataPagination
          page={currentPage}
          pageSize={pageSize}
          total={filteredAssets.length}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}
