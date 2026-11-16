"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { toast } from "@/components/ui/toast";
import {
  Asset,
  AssetCategory,
  AssetLocation,
  AssetMaintenance,
  Person,
  Role,
} from "@/lib/types";
import { setUrlParam } from "@/lib/url-params";

export type DrawerTab = "overview" | "timeline" | "maintenance";

interface AssetsContextValue {
  assets: Asset[];
  categories: AssetCategory[];
  locations: AssetLocation[];
  maintenance: AssetMaintenance[];
  people: Person[];
  roles: Role[];
  loading: boolean;
  isSyncing: boolean;

  detailAsset: Asset | null;
  detailDrawerTab: DrawerTab;
  setDetailDrawerTab: (tab: DrawerTab) => void;
  openDetailDrawer: (asset: Asset, tab?: DrawerTab) => void;
  closeDetailDrawer: () => void;

  // Print selection
  selectedForPrint: Asset[];
  toggleSelectForPrint: (asset: Asset) => void;
  selectAllForPrint: (assets: Asset[]) => void;
  clearSelectForPrint: () => void;

  // Modals
  assetModalState: { open: boolean; asset?: Asset };
  openAssetModal: (asset?: Asset) => void;
  closeAssetModal: () => void;

  checkoutModalState: { open: boolean; asset?: Asset };
  openCheckoutModal: (asset: Asset) => void;
  closeCheckoutModal: () => void;

  checkinModalState: { open: boolean; asset?: Asset };
  openCheckinModal: (asset: Asset) => void;
  closeCheckinModal: () => void;

  printModalState: { open: boolean; assets: Asset[]; mode: "single" | "sheet" };
  openPrintModal: (assets: Asset[], mode?: "single" | "sheet") => void;
  closePrintModal: () => void;

  isScannerOpen: boolean;
  setIsScannerOpen: (open: boolean) => void;

  maintenanceModalState: { open: boolean; asset?: Asset };
  openMaintenanceModal: (asset: Asset) => void;
  closeMaintenanceModal: () => void;

  isGuideModalOpen: boolean;
  setIsGuideModalOpen: (open: boolean) => void;

  // Actions
  refreshData: () => Promise<void>;
  syncNow: () => Promise<void>;
  showToast: (msg: string) => void;
  onSaveAsset: (fields: Partial<Asset>) => Promise<Asset>;
  onDeleteAsset: (id: string) => Promise<void>;
  onCheckout: (input: { asset_id: string; custodian_email: string; department?: string; expected_return?: string; notes?: string }) => Promise<void>;
  onCheckin: (input: { asset_id: string; condition: string; location_id?: string; notes?: string }) => Promise<void>;
  onLogMaintenance: (input: Partial<AssetMaintenance>) => Promise<void>;
}

const AssetsContext = createContext<AssetsContextValue | null>(null);

export function AssetsProvider({ children }: { children: ReactNode }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [locations, setLocations] = useState<AssetLocation[]>([]);
  const [maintenance, setMaintenance] = useState<AssetMaintenance[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);
  const [detailDrawerTab, setDetailDrawerTab] = useState<DrawerTab>("overview");
  const [selectedForPrint, setSelectedForPrint] = useState<Asset[]>([]);

  const [assetModalState, setAssetModalState] = useState<{ open: boolean; asset?: Asset }>({ open: false });
  const [checkoutModalState, setCheckoutModalState] = useState<{ open: boolean; asset?: Asset }>({ open: false });
  const [checkinModalState, setCheckinModalState] = useState<{ open: boolean; asset?: Asset }>({ open: false });
  const [printModalState, setPrintModalState] = useState<{ open: boolean; assets: Asset[]; mode: "single" | "sheet" }>({ open: false, assets: [], mode: "single" });
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [maintenanceModalState, setMaintenanceModalState] = useState<{ open: boolean; asset?: Asset }>({ open: false });
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  const showToast = useCallback((msg: string) => {
    toast(msg);
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const res = await fetch("/api/assets");
      // Session expired or access removed (e.g. deactivated on the Team page).
      if (res.status === 401) {
        window.location.href = "/login?error=session";
        return;
      }
      const data = await res.json();
      if (res.ok && data) {
        setAssets(data.assets || []);
        setCategories(data.categories || []);
        setLocations(data.locations || []);
        setMaintenance(data.maintenance || []);
        setPeople(data.people || []);
        setRoles(data.roles || []);
      }
    } catch (err) {
      console.error("Failed to load asset data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const syncNow = async () => {
    setIsSyncing(true);
    try {
      await refreshData();
      showToast("Workspace refreshed");
    } finally {
      setIsSyncing(false);
    }
  };

  const openDetailDrawer = useCallback((asset: Asset, tab: DrawerTab = "overview") => {
    setDetailAsset(asset);
    setDetailDrawerTab(tab);
    setUrlParam("item", asset.id);
  }, []);

  const closeDetailDrawer = useCallback(() => {
    setDetailAsset(null);
    setUrlParam("item", null);
  }, []);

  const toggleSelectForPrint = useCallback((asset: Asset) => {
    setSelectedForPrint((prev) =>
      prev.some((a) => a.id === asset.id) ? prev.filter((a) => a.id !== asset.id) : [...prev, asset]
    );
  }, []);

  const selectAllForPrint = useCallback((items: Asset[]) => {
    setSelectedForPrint(items);
  }, []);

  const clearSelectForPrint = useCallback(() => {
    setSelectedForPrint([]);
  }, []);

  const openAssetModal = (asset?: Asset) => setAssetModalState({ open: true, asset });
  const closeAssetModal = () => setAssetModalState({ open: false });

  const openCheckoutModal = (asset: Asset) => setCheckoutModalState({ open: true, asset });
  const closeCheckoutModal = () => setCheckoutModalState({ open: false });

  const openCheckinModal = (asset: Asset) => setCheckinModalState({ open: true, asset });
  const closeCheckinModal = () => setCheckinModalState({ open: false });

  const openPrintModal = (items: Asset[], mode: "single" | "sheet" = "single") =>
    setPrintModalState({ open: true, assets: items, mode });
  const closePrintModal = () => setPrintModalState({ open: false, assets: [], mode: "single" });

  const openMaintenanceModal = (asset: Asset) => setMaintenanceModalState({ open: true, asset });
  const closeMaintenanceModal = () => setMaintenanceModalState({ open: false });

  const onSaveAsset = async (fields: Partial<Asset>): Promise<Asset> => {
    const isNew = !fields.id;
    const res = await fetch("/api/assets", {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save asset");

    const saved: Asset = data.asset;
    setAssets((prev) =>
      isNew ? [saved, ...prev] : prev.map((a) => (a.id === saved.id ? saved : a))
    );
    if (detailAsset?.id === saved.id) setDetailAsset(saved);
    showToast(isNew ? "Asset registered" : "Asset updated");
    return saved;
  };

  const onDeleteAsset = async (id: string) => {
    const res = await fetch(`/api/assets?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to archive asset");
    }
    setAssets((prev) => prev.filter((a) => a.id !== id));
    if (detailAsset?.id === id) closeDetailDrawer();
    showToast("Asset archived");
  };

  const onCheckout = async (input: {
    asset_id: string;
    custodian_email: string;
    department?: string;
    expected_return?: string;
    notes?: string;
  }) => {
    const res = await fetch("/api/assets/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to checkout asset");

    const updated: Asset = data.asset;
    setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    if (detailAsset?.id === updated.id) setDetailAsset(updated);
    showToast("Asset checked out");
  };

  const onCheckin = async (input: {
    asset_id: string;
    condition: string;
    location_id?: string;
    notes?: string;
  }) => {
    const res = await fetch("/api/assets/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to checkin asset");

    const updated: Asset = data.asset;
    setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    if (detailAsset?.id === updated.id) setDetailAsset(updated);
    showToast("Asset checked in");
  };

  const onLogMaintenance = async (input: Partial<AssetMaintenance>) => {
    const res = await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to log maintenance");

    const record: AssetMaintenance = data.record;
    setMaintenance((prev) => [record, ...prev]);
    if (input.asset_id && input.status === "in_progress") {
      setAssets((prev) =>
        prev.map((a) => (a.id === input.asset_id ? { ...a, status: "Maintenance" } : a))
      );
    }
    showToast("Maintenance ticket logged");
  };

  return (
    <AssetsContext.Provider
      value={{
        assets,
        categories,
        locations,
        maintenance,
        people,
        roles,
        loading,
        isSyncing,
        detailAsset,
        detailDrawerTab,
        setDetailDrawerTab,
        openDetailDrawer,
        closeDetailDrawer,
        selectedForPrint,
        toggleSelectForPrint,
        selectAllForPrint,
        clearSelectForPrint,
        assetModalState,
        openAssetModal,
        closeAssetModal,
        checkoutModalState,
        openCheckoutModal,
        closeCheckoutModal,
        checkinModalState,
        openCheckinModal,
        closeCheckinModal,
        printModalState,
        openPrintModal,
        closePrintModal,
        isScannerOpen,
        setIsScannerOpen,
        maintenanceModalState,
        openMaintenanceModal,
        closeMaintenanceModal,
        isGuideModalOpen,
        setIsGuideModalOpen,
        refreshData,
        syncNow,
        showToast,
        onSaveAsset,
        onDeleteAsset,
        onCheckout,
        onCheckin,
        onLogMaintenance,
      }}
    >
      {children}
    </AssetsContext.Provider>
  );
}

export function useAssets(): AssetsContextValue {
  const ctx = useContext(AssetsContext);
  if (!ctx) throw new Error("useAssets must be used within an AssetsProvider");
  return ctx;
}

