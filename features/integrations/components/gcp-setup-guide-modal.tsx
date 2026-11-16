"use client";

import React, { useEffect, useState } from "react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormActions } from "@/components/ui/form-layout";
import { useAssets } from "@/context/assets-context";
import { AlertCircle, CheckCircle2, ExternalLink, RefreshCw, Sparkles } from "lucide-react";

export function GcpSetupGuideModal() {
  const { isGuideModalOpen, setIsGuideModalOpen, showToast, refreshData } = useAssets();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/system/upgrade-sheets");
      const data = await res.json();
      if (res.ok && data) setStatus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isGuideModalOpen) fetchStatus();
  }, [isGuideModalOpen]);

  const handleUpgrade = async () => {
    try {
      setUpgrading(true);
      const res = await fetch("/api/system/upgrade-sheets", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to upgrade sheet");
      showToast("Google Sheet structure upgraded and initialized!");
      await fetchStatus();
      await refreshData();
    } catch (err: any) {
      showToast(err.message || "Upgrade failed");
    } finally {
      setUpgrading(false);
    }
  };

  if (!isGuideModalOpen) return null;

  return (
    <ResponsiveModal
      open={isGuideModalOpen}
      onOpenChange={setIsGuideModalOpen}
      title="Google Sheet setup"
      description="Check the connection and create any missing tabs and columns."
      footer={
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Adds missing tabs and columns. Existing rows are never changed.</p>
          <FormActions>
            <Button type="button" variant="outline" onClick={() => setIsGuideModalOpen(false)}>
              Close
            </Button>
            <Button type="button" onClick={handleUpgrade} disabled={upgrading || loading} className="gap-1.5">
              <Sparkles />
              {upgrading ? "Upgrading..." : "Initialize / upgrade sheet"}
            </Button>
          </FormActions>
        </div>
      }
    >
      <div className="space-y-4 text-sm">
        {status?.spreadsheetUrl && (
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
            <div>
              <p className="font-semibold text-foreground">{status.spreadsheetTitle || "Google Sheet"}</p>
              <p className="font-mono text-xs text-muted-foreground truncate max-w-xs">
                {status.spreadsheetId}
              </p>
            </div>
            <a
              href={status.spreadsheetUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
            >
              Open Sheet <ExternalLink className="size-3" />
            </a>
          </div>
        )}

        {/* Tabs Verification List */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            Required tabs
          </h3>
          <div className="divide-y border rounded-lg overflow-hidden bg-card">
            {status?.tabs?.map((tab: any) => (
              <div key={tab.name} className="p-2.5 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-mono font-semibold text-foreground">{tab.name}</span>
                  {tab.missingColumns?.length > 0 && (
                    <p className="text-xs text-warning">
                      Missing columns: {tab.missingColumns.join(", ")}
                    </p>
                  )}
                </div>
                {tab.exists && tab.missingColumns.length === 0 ? (
                  <Badge variant="outline" className="gap-1 border-success/20 bg-success/10 text-success">
                    <CheckCircle2 className="size-3" /> Ready ({tab.rowCount} rows)
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 border-warning/20 bg-warning/10 text-warning">
                    <AlertCircle className="size-3" /> Action required
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ResponsiveModal>
  );
}

