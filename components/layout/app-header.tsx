"use client";

import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { HelpCircle, QrCode } from "lucide-react";
import { NavView } from "@/lib/types";
import { useAssets } from "@/context/assets-context";
import { useAuth } from "@/context/auth-context";

interface AppHeaderProps {
  activeView: NavView;
}

const VIEW_TITLES: Record<NavView, { section: string; title: string }> = {
  dashboard: { section: "Overview", title: "Executive Dashboard" },
  inventory: { section: "Operations", title: "Asset Inventory" },
  checkout: { section: "Operations", title: "Custody & Handover" },
  maintenance: { section: "Operations", title: "Maintenance & Repairs" },
  "qr-studio": { section: "Operations", title: "QR Label Studio" },
  scanner: { section: "Operations", title: "Barcode Scanner" },
  categories: { section: "Configuration", title: "Asset Categories" },
  locations: { section: "Configuration", title: "Office Locations" },
  team: { section: "Administration", title: "Team Members" },
  roles: { section: "Administration", title: "Roles & Permissions" },
};

export function AppHeader({ activeView }: AppHeaderProps) {
  const { setIsGuideModalOpen, setIsScannerOpen } = useAssets();
  const { can } = useAuth();

  const current = VIEW_TITLES[activeView] || { section: "Workspace", title: "Dashboard" };

  React.useEffect(() => {
    document.title = `${current.title} · Assets Management`;
  }, [current.title]);

  return (
    <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
      {/* min-w-0 lets the page title truncate instead of pushing the buttons off small screens. */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <SidebarTrigger className="-ml-1 shrink-0" />
        <Separator orientation="vertical" className="mr-2 h-4 shrink-0 self-center" />
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="flex-nowrap text-sm">
            <BreadcrumbItem className="hidden md:block">
              <span className="text-muted-foreground">{current.section}</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="truncate font-medium text-foreground">
                {current.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* Quick QR Scanner Trigger */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsScannerOpen(true)}
          className="gap-1.5"
        >
          <QrCode className="h-3.5 w-3.5 text-primary" />
          <span className="hidden sm:inline">Scan QR Code</span>
        </Button>

        {/* GCP Sheet Guide Modal Trigger */}
        {can("system.manage") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsGuideModalOpen(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Setup Guide</span>
          </Button>
        )}
      </div>
    </header>
  );
}

