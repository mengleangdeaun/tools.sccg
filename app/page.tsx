"use client";

import React, { use, useState, useEffect } from "react";
import { ConfirmProvider } from "@/components/shared/confirm-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AssetsProvider, useAssets } from "@/context/assets-context";
import { AuthProvider } from "@/context/auth-context";
import { NavView } from "@/lib/types";
import { setUrlParam } from "@/lib/url-params";
import { RefreshCw } from "lucide-react";

import { AssetDashboardView } from "@/features/dashboard/components/asset-dashboard-view";
import { AssetInventoryView } from "@/features/assets/components/asset-inventory-view";
import { AssetDetailDrawer } from "@/features/assets/components/asset-detail-drawer";
import { AssetFormModal } from "@/features/assets/components/asset-form-modal";
import { CustodyView } from "@/features/custody/components/custody-view";
import { CheckoutModal } from "@/features/custody/components/checkout-modal";
import { CheckinModal } from "@/features/custody/components/checkin-modal";
import { QrLabelPrinterModal } from "@/features/qr-codes/components/qr-label-printer-modal";
import { QrScannerModal } from "@/features/qr-codes/components/qr-scanner-modal";
import { QrStudioView } from "@/features/qr-codes/components/qr-studio-view";
import { QrScannerView } from "@/features/qr-codes/components/qr-scanner-view";
import { MaintenanceView } from "@/features/maintenance/components/maintenance-view";
import { MaintenanceModal } from "@/features/maintenance/components/maintenance-modal";
import { CategoriesView } from "@/features/categories/components/categories-view";
import { LocationsView } from "@/features/locations/components/locations-view";
import { TeamView } from "@/features/team/components/team-view";
import { RolesView } from "@/features/team/components/roles-view";
import { GcpSetupGuideModal } from "@/features/integrations/components/gcp-setup-guide-modal";

const VIEWS: NavView[] = [
  "dashboard",
  "inventory",
  "checkout",
  "maintenance",
  "qr-studio",
  "scanner",
  "categories",
  "locations",
  "team",
  "roles",
];

function AssetAppShell({ initialView, initialItem }: { initialView: NavView; initialItem?: string }) {
  const [activeView, setActiveViewState] = useState<NavView>(initialView);
  const { loading, assets, openDetailDrawer } = useAssets();

  const setActiveView = (view: NavView) => {
    setActiveViewState(view);
    setUrlParam("view", view);
  };

  // Open asset drawer if ?item=... was in URL
  useEffect(() => {
    if (initialItem && assets.length > 0) {
      const match = assets.find((a) => a.id === initialItem || a.tag_code === initialItem);
      if (match) openDetailDrawer(match);
    }
  }, [initialItem, assets, openDetailDrawer]);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar activeView={activeView} setActiveView={setActiveView} />

        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <AppHeader activeView={activeView} />

          <div className="w-full min-w-0 flex-1 p-4 md:p-6 xl:p-8">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-5 w-5 animate-spin [animation-duration:650ms]" />
                  <span className="text-sm">Loading asset records...</span>
                </div>
              </div>
            ) : (
              <div key={activeView} className="animate-in fade-in-50 duration-200 ease-[var(--ease-out)]">
                {activeView === "dashboard" && <AssetDashboardView onNavigate={setActiveView} />}
                {activeView === "inventory" && <AssetInventoryView />}
                {activeView === "checkout" && <CustodyView />}
                {activeView === "maintenance" && <MaintenanceView />}
                {activeView === "qr-studio" && <QrStudioView />}
                {activeView === "scanner" && <QrScannerView />}
                {activeView === "categories" && <CategoriesView />}
                {activeView === "locations" && <LocationsView />}
                {activeView === "team" && <TeamView />}
                {activeView === "roles" && <RolesView />}
              </div>
            )}
          </div>
        </SidebarInset>

        {/* Global Modals & Drawers */}
        <AssetDetailDrawer />
        <AssetFormModal />
        <CheckoutModal />
        <CheckinModal />
        <QrLabelPrinterModal />
        <QrScannerModal />
        <MaintenanceModal />
        <GcpSetupGuideModal />
      </div>
    </SidebarProvider>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { view, item } = use(searchParams);
  const initialView = VIEWS.find((v) => v === view) ?? "dashboard";
  const initialItem = typeof item === "string" ? item : undefined;

  return (
    <AuthProvider>
      <ConfirmProvider>
        <AssetsProvider>
          {/* One tooltip group, so moving between tooltips shows the next one instantly. */}
          <TooltipProvider>
            <AssetAppShell initialView={initialView} initialItem={initialItem} />
          </TooltipProvider>
        </AssetsProvider>
      </ConfirmProvider>
    </AuthProvider>
  );
}

