"use client";

import React from "react";
import { ArrowRight, Boxes, CheckCircle2, Plus, Printer, ScanLine, ShieldAlert, UserCheck, Wrench } from "lucide-react";
import { useAssets } from "@/context/assets-context";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard, StatsGrid } from "@/components/shared/stats-card";
import { NoData } from "@/components/shared/empty-state";
import { AssetStatusBadge } from "@/features/assets/components/asset-status-badge";
import { daysUntil, formatDisplayDate } from "@/lib/date-utils";
import { formatCurrency } from "@/lib/format";
import { setUrlParams } from "@/lib/url-params";
import { cn } from "@/lib/utils";
import { NavView } from "@/lib/types";

interface AssetDashboardViewProps {
  onNavigate: (view: NavView) => void;
}

const ROW = "flex w-full items-center justify-between gap-3 rounded-md px-2 py-2.5 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50";

function Section({ title, icon, action, children }: { title: string; icon?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="gap-3 p-4">
      <div className="flex items-center justify-between gap-2 border-b pb-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground [&_svg]:size-4">
          {icon}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

export function AssetDashboardView({ onNavigate }: AssetDashboardViewProps) {
  const { assets, categories, openAssetModal, openDetailDrawer, setIsScannerOpen, openPrintModal } = useAssets();
  const { can } = useAuth();

  // Opens the inventory with these filters applied (the inventory reads them from the URL).
  const openInventory = (filters: { status?: string; category?: string } = {}) => {
    setUrlParams({ status: filters.status ?? null, category: filters.category ?? null });
    onNavigate("inventory");
  };

  const totalAssets = assets.length;
  const countBy = (status: string) => assets.filter((a) => a.status === status).length;
  const assignedCount = countBy("Assigned");
  const availableCount = countBy("Available");
  const maintenanceCount = countBy("Maintenance");

  const totalValue = assets.reduce((sum, a) => {
    const val = parseFloat(a.purchase_price || "0");
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const utilizationRate = totalAssets > 0 ? Math.round((assignedCount / totalAssets) * 100) : 0;

  const expiringWarranties = assets
    .filter((a) => {
      const days = daysUntil(a.warranty_expiry);
      return days !== null && days >= 0 && days <= 60;
    })
    .sort((a, b) => (daysUntil(a.warranty_expiry) || 0) - (daysUntil(b.warranty_expiry) || 0));

  const categoryCounts = categories.map((cat) => ({
    ...cat,
    count: assets.filter((a) => a.category_id === cat.id).length,
  }));

  const recentAssets = [...assets].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || "")).slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Inventory, custody and warranty status across the company."
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => setIsScannerOpen(true)}>
              <ScanLine className="text-primary" />
              Scan QR
            </Button>
            {can("assets.print") && (
              <Button size="sm" variant="outline" onClick={() => openPrintModal(assets.slice(0, 18), "sheet")}>
                <Printer />
                Batch QR Labels
              </Button>
            )}
            {can("assets.create") && (
              <Button size="sm" onClick={() => openAssetModal()}>
                <Plus />
                New Asset
              </Button>
            )}
          </>
        }
      />

      <StatsGrid columns={4}>
        <StatsCard
          label="Total assets"
          value={totalAssets}
          icon={<Boxes />}
          hint={`Total value ${formatCurrency(totalValue)}`}
          onClick={() => openInventory()}
        />
        <StatsCard
          label="Assigned"
          value={assignedCount}
          icon={<UserCheck className="text-info" />}
          hint={`${utilizationRate}% deployment rate`}
          onClick={() => openInventory({ status: "Assigned" })}
        />
        <StatsCard
          label="Available"
          value={availableCount}
          icon={<CheckCircle2 className="text-success" />}
          hint="Ready for checkout"
          onClick={() => openInventory({ status: "Available" })}
        />
        <StatsCard
          label="In maintenance"
          value={maintenanceCount}
          icon={<Wrench className="text-warning" />}
          hint="Under repair or service"
          tone={maintenanceCount > 0 ? "warning" : "default"}
          onClick={() => openInventory({ status: "Maintenance" })}
        />
      </StatsGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section
            title="Upcoming warranty expirations"
            icon={<ShieldAlert className="text-warning" />}
            action={<span className="text-xs text-muted-foreground">Next 60 days</span>}
          >
            {expiringWarranties.length === 0 ? (
              <NoData size="sm" icon={<ShieldAlert />} title="No warranties expiring" description="Nothing expires in the next 60 days." />
            ) : (
              <ul className="divide-y">
                {expiringWarranties.map((asset) => {
                  const days = daysUntil(asset.warranty_expiry) || 0;
                  return (
                    <li key={asset.id}>
                      <button type="button" onClick={() => openDetailDrawer(asset)} className={ROW}>
                        <span className="min-w-0 space-y-0.5">
                          <span className="flex items-center gap-2 text-sm">
                            <span className="font-mono text-xs font-medium text-muted-foreground">{asset.tag_code}</span>
                            <span className="truncate font-medium text-foreground">{asset.name}</span>
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            Custodian: {asset.custodian_email || "In stock"}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded-md px-2 py-0.5 text-xs font-medium tabular-nums",
                            days <= 14 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                          )}
                        >
                          {days} days left
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <Section
            title="Assets by category"
            action={
              <Button variant="link" size="sm" onClick={() => openInventory()} className="h-auto gap-1 p-0">
                View inventory <ArrowRight />
              </Button>
            }
          >
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {categoryCounts.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => openInventory({ category: cat.id })}
                  className="space-y-1 rounded-lg border bg-muted/20 p-3 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <span className="block truncate text-sm font-medium text-foreground">{cat.name}</span>
                  <span className="block text-xl font-semibold tabular-nums text-foreground">{cat.count}</span>
                </button>
              ))}
            </div>
          </Section>
        </div>

        <Section title="Recently added">
          {recentAssets.length === 0 ? (
            <NoData size="sm" title="No assets yet" />
          ) : (
            <ul className="-mx-2 divide-y">
              {recentAssets.map((asset) => (
                <li key={asset.id}>
                  <button type="button" onClick={() => openDetailDrawer(asset)} className={cn(ROW, "flex-col items-stretch gap-1")}>
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-medium text-muted-foreground">{asset.tag_code}</span>
                      <AssetStatusBadge status={asset.status} />
                    </span>
                    <span className="truncate text-sm font-medium text-foreground">{asset.name}</span>
                    <span className="text-xs text-muted-foreground">{formatDisplayDate(asset.created_at)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
