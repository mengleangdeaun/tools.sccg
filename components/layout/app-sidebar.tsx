"use client";

import React, { useState } from "react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  ArrowLeftRight,
  Boxes,
  Building,
  ChevronsUpDown,
  LayoutDashboard,
  LogOut,
  Printer,
  QrCode,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Tags,
  Truck,
  UserPen,
  Users,
  Wrench,
} from "lucide-react";
import { NavView } from "@/lib/types";
import { useAssets } from "@/context/assets-context";
import { useAuth } from "@/context/auth-context";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { ProfileDialog } from "@/features/team/components/profile-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppSidebarProps {
  activeView: NavView;
  setActiveView: (view: NavView) => void;
}

export function AppSidebar({ activeView, setActiveView }: AppSidebarProps) {
  const { isSyncing, syncNow } = useAssets();
  const { currentUser, can, signOut } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  // Shown only once known; no made-up "Administrator" while loading.
  const displayName = currentUser ? currentUser.name || currentUser.email : "";

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      {/* Workspace Brand Header */}
      <SidebarHeader className="h-12 justify-center border-b px-3 items-start group-data-[collapsible=icon]:items-center">
        <img
          src="/assets/logo-landscape.svg"
          alt="SCC Group"
          className="h-7 w-auto object-contain group-data-[collapsible=icon]:hidden"
        />
        <img
          src="/assets/logo-square.svg"
          alt="SCC Group"
          className="hidden h-7 w-7 object-contain group-data-[collapsible=icon]:block"
        />
      </SidebarHeader>

      <SidebarContent>
        {/* Core Operations Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeView === "dashboard"}
                  onClick={() => setActiveView("dashboard")}
                  tooltip="Dashboard"
                  className="gap-2.5 font-medium text-sm"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeView === "inventory"}
                  onClick={() => setActiveView("inventory")}
                  tooltip="Asset Inventory"
                  className="gap-2.5 font-medium text-sm"
                >
                  <Boxes className="h-4 w-4" />
                  <span>Asset Inventory</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {can("assets.custody") && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeView === "checkout"}
                    onClick={() => setActiveView("checkout")}
                    tooltip="Custody & Handover"
                    className="gap-2.5 font-medium text-sm"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                    <span>Custody & Handover</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {can("assets.maintenance") && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeView === "maintenance"}
                    onClick={() => setActiveView("maintenance")}
                    tooltip="Maintenance & Repairs"
                    className="gap-2.5 font-medium text-sm"
                  >
                    <Wrench className="h-4 w-4" />
                    <span>Maintenance</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {can("assets.print") && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeView === "qr-studio"}
                    onClick={() => setActiveView("qr-studio")}
                    tooltip="QR Label Studio"
                    className="gap-2.5 font-medium text-sm"
                  >
                    <Printer className="h-4 w-4" />
                    <span>QR Label Studio</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeView === "scanner"}
                  onClick={() => setActiveView("scanner")}
                  tooltip="QR Code Scanner"
                  className="gap-2.5 font-medium text-sm"
                >
                  <ScanLine className="h-4 w-4" />
                  <span>Barcode Scanner</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Configuration Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Configuration
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {can("categories.manage") && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeView === "categories"}
                    onClick={() => setActiveView("categories")}
                    tooltip="Categories"
                    className="gap-2.5 font-medium text-sm"
                  >
                    <Tags className="h-4 w-4" />
                    <span>Categories</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {can("locations.manage") && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeView === "locations"}
                    onClick={() => setActiveView("locations")}
                    tooltip="Locations"
                    className="gap-2.5 font-medium text-sm"
                  >
                    <Building className="h-4 w-4" />
                    <span>Office Locations</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {can("suppliers.manage") && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeView === "suppliers"}
                    onClick={() => setActiveView("suppliers")}
                    tooltip="Suppliers"
                    className="gap-2.5 font-medium text-sm"
                  >
                    <Truck className="h-4 w-4" />
                    <span>Suppliers</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {can("team.manage") && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeView === "team"}
                    onClick={() => setActiveView("team")}
                    tooltip="Team"
                    className="gap-2.5 font-medium text-sm"
                  >
                    <Users className="h-4 w-4" />
                    <span>Team</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {can("roles.manage") && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeView === "roles"}
                    onClick={() => setActiveView("roles")}
                    tooltip="Roles & Permissions"
                    className="gap-2.5 font-medium text-sm"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Roles & Permissions</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        {/* Sync Trigger */}
        <Button
          variant="outline"
          size="sm"
          disabled={isSyncing}
          onClick={syncNow}
          className="w-full justify-start gap-2 h-8 font-medium group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          <span className="group-data-[collapsible=icon]:hidden">
            {isSyncing ? "Syncing..." : "Sync Sheet"}
          </span>
        </Button>

        {/* User Account Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex w-full items-center gap-2.5 rounded-md p-1.5 text-left hover:bg-muted transition-colors group-data-[collapsible=icon]:justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            aria-label={displayName ? `Account menu for ${displayName}` : "Account menu"}
          >
            <PersonAvatar name={displayName || "?"} avatarUrl={currentUser?.avatar_url} className="size-7" />
            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{currentUser?.role_name}</p>
            </div>
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-1.5">
            <DropdownMenuGroup>
              <div className="flex items-center gap-2.5 px-2 py-2 text-left">
                <PersonAvatar name={displayName || "?"} avatarUrl={currentUser?.avatar_url} className="size-7 shrink-0" />
                <div className="grid flex-1 min-w-0 leading-tight">
                  <span className="truncate text-sm font-medium text-foreground">{displayName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {currentUser?.email}
                  </span>
                  <span className="mt-0.5 truncate text-xs font-medium text-primary">{currentUser?.role_name}</span>
                </div>
              </div>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsProfileOpen(true)} disabled={!currentUser} className="gap-2 cursor-pointer">
              <UserPen className="size-4" />
              <span>Edit profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={signOut} className="text-destructive gap-2 cursor-pointer">
              <LogOut className="size-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {isProfileOpen && <ProfileDialog onClose={() => setIsProfileOpen(false)} />}
      </SidebarFooter>
    </Sidebar>
  );
}
