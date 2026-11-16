"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  ArrowDownLeft,
  ArrowRight,
  Clock,
  Edit2,
  FileText,
  History,
  Info,
  MapPin,
  Pencil,
  Printer,
  QrCode,
  ShieldAlert,
  Trash2,
  User,
  UserCheck,
  Wrench,
} from "lucide-react";
import { useAssets } from "@/context/assets-context";
import { useAuth } from "@/context/auth-context";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { AssetStatusBadge } from "./asset-status-badge";
import { AssetStatusSelect } from "./asset-status-select";
import { AssetConditionBadge } from "./asset-condition-badge";
import { AssetTimelinePanel } from "./asset-timeline-panel";
import { AssetMaintenancePanel } from "./asset-maintenance-panel";
import { daysUntil, formatDisplayDate, isExpiringSoon } from "@/lib/date-utils";
import { formatCurrency } from "@/lib/format";

function DetailRow({ label, value, icon }: { label: string; value?: React.ReactNode; icon?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-b py-2 text-sm">
      <span className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="min-w-0 text-right font-medium break-words text-foreground">{value}</span>
    </div>
  );
}

export function AssetDetailDrawer() {
  const {
    detailAsset: asset,
    closeDetailDrawer,
    detailDrawerTab,
    setDetailDrawerTab,
    categories,
    locations,
    openCheckoutModal,
    openCheckinModal,
    openPrintModal,
    openAssetModal,
    onDeleteAsset,
    onSaveAsset,
  } = useAssets();

  const { can } = useAuth();
  const confirm = useConfirm();
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (!asset) return;
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    QRCode.toDataURL(`${baseUrl}/?item=${asset.id}`, { width: 160, margin: 1 })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [asset]);

  if (!asset) return null;

  const category = categories.find((c) => c.id === asset.category_id);
  const location = locations.find((l) => l.id === asset.location_id);
  const warrantyDays = daysUntil(asset.warranty_expiry);

  return (
    <ResponsiveModal
      open={Boolean(asset)}
      variant="side"
      onOpenChange={(isOpen: boolean) => !isOpen && closeDetailDrawer()}
      title={asset.name}
      description={`Asset Tag: ${asset.tag_code}`}
    >
      <div className="space-y-4 pt-2">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b">
          <div className="flex items-center gap-2">
            <div className="w-36">
              <AssetStatusSelect
                asset={asset}
                onStatusChange={(item, newStatus) => onSaveAsset({ id: item.id, status: newStatus })}
              />
            </div>
            <AssetConditionBadge condition={asset.condition} />
          </div>

          <div className="flex items-center gap-1.5">
            {asset.status === "Available" && can("assets.custody") && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => openCheckoutModal(asset)}
                className="gap-1.5"
              >
                <UserCheck className="size-3.5 text-primary" />
                Check-out
              </Button>
            )}

            {asset.status === "Assigned" && can("assets.custody") && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => openCheckinModal(asset)}
                className="gap-1.5"
              >
                <ArrowDownLeft className="size-3.5 text-success" />
                Check-in
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => openPrintModal([asset], "single")}
              className="gap-1.5"
            >
              <Printer className="size-3.5" />
              Print QR
            </Button>

            {can("assets.edit") && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openAssetModal(asset)}
                aria-label={`Edit ${asset.tag_code}`}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="size-3.5" />
              </Button>
            )}

            {can("assets.delete") && (
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  const ok = await confirm({
                    title: `Archive ${asset.tag_code}?`,
                    description: `"${asset.name}" leaves the inventory and every list. Its history and the sheet row are kept, so it can be restored there.`,
                    confirmLabel: "Archive",
                  });
                  if (ok) onDeleteAsset(asset.id);
                }}
                aria-label={`Archive ${asset.tag_code}`}
                className="h-8 w-8 p-0 text-destructive"
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs
          value={detailDrawerTab}
          onValueChange={(tab) => setDetailDrawerTab(tab as any)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="overview" className="gap-1.5">
              <Info className="size-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-1.5">
              <History className="size-3.5" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="gap-1.5">
              <Wrench className="size-3.5" />
              Service Log
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab Content */}
          <TabsContent value="overview" className="space-y-4 pt-3">
            {/* Quick QR & Specs Banner */}
            <div className="flex items-center gap-4 p-3 bg-muted/40 rounded-lg border">
              <div className="shrink-0 bg-white p-1 rounded border">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt={asset.tag_code} className="size-18 object-contain" />
                ) : (
                  <div className="size-18 bg-muted animate-pulse rounded" />
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-mono text-xs font-medium text-muted-foreground">{asset.tag_code}</p>
                <p className="truncate text-base font-semibold text-foreground">{asset.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {asset.brand} {asset.model}
                </p>
                {asset.serial_number && (
                  <p className="font-mono text-xs text-muted-foreground">
                    S/N: {asset.serial_number}
                  </p>
                )}
              </div>
            </div>

            {/* Custody Information */}
            <div className="space-y-1">
              <h3 className="pb-1 text-sm font-semibold text-foreground">
                Custody & Assignment
              </h3>
              <DetailRow
                label="Current Custodian"
                value={asset.custodian_email || "In Stock (Available)"}
                icon={<User className="size-3.5" />}
              />
              <DetailRow label="Department" value={asset.department || "—"} />
              <DetailRow
                label="Location"
                value={location?.name || "—"}
                icon={<MapPin className="size-3.5" />}
              />
              <DetailRow
                label="Assigned Date"
                value={formatDisplayDate(asset.assigned_date)}
              />
              <DetailRow
                label="Expected Return"
                value={formatDisplayDate(asset.expected_return)}
              />
            </div>

            {/* Financial & Warranty Information */}
            <div className="space-y-1">
              <h3 className="pb-1 text-sm font-semibold text-foreground">
                Purchase & Warranty
              </h3>
              <DetailRow label="Category" value={category?.name || "General Asset"} />
              <DetailRow
                label="Purchase Date"
                value={formatDisplayDate(asset.purchase_date)}
              />
              <DetailRow
                label="Purchase Cost"
                value={asset.purchase_price ? formatCurrency(parseFloat(asset.purchase_price) || 0) : "—"}
              />
              <DetailRow label="Supplier" value={asset.supplier || "—"} />
              <DetailRow
                label="Warranty Expiry"
                value={
                  asset.warranty_expiry ? (
                    <div className="flex items-center gap-1.5">
                      <span>{formatDisplayDate(asset.warranty_expiry)}</span>
                      {warrantyDays !== null && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                            warrantyDays < 0
                              ? "bg-destructive/10 text-destructive"
                              : warrantyDays <= 30
                              ? "bg-warning/10 text-warning"
                              : "bg-success/10 text-success"
                          }`}
                        >
                          {warrantyDays < 0 ? "Expired" : `${warrantyDays}d left`}
                        </span>
                      )}
                    </div>
                  ) : (
                    "—"
                  )
                }
                icon={<ShieldAlert className="size-3.5" />}
              />
            </div>

            {/* Additional Notes */}
            {asset.notes && (
              <div className="space-y-1 pt-2">
                <h3 className="pb-1 text-sm font-semibold text-foreground">
                  Notes & Specifications
                </h3>
                <p className="whitespace-pre-wrap rounded border bg-muted/30 p-3 text-sm leading-relaxed text-foreground">
                  {asset.notes}
                </p>
              </div>
            )}
          </TabsContent>

          {/* Timeline Tab Content */}
          <TabsContent value="timeline" className="pt-3">
            <AssetTimelinePanel asset={asset} />
          </TabsContent>

          {/* Service Log Tab Content */}
          <TabsContent value="maintenance" className="pt-3">
            <AssetMaintenancePanel asset={asset} />
          </TabsContent>
        </Tabs>
      </div>
    </ResponsiveModal>
  );
}
