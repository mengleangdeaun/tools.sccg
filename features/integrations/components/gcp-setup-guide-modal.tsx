"use client";

import React, { useEffect, useState } from "react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { FormActions } from "@/components/ui/form-layout";
import { useAssets } from "@/context/assets-context";
import { AlertCircle, CheckCircle2, ExternalLink, Sparkles } from "lucide-react";

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
        {loading && !status && (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Spinner />
            Checking the sheet…
          </div>
        )}

        {!loading && !status && (
          <div role="alert" className="flex gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive">
            <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span className="min-w-0 break-words">Couldn't reach the Google Sheet. Check the sheet ID and service account in .env, then reopen this dialog.</span>
          </div>
        )}

        {status?.spreadsheetUrl && (
          <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground" title={status.spreadsheetTitle}>
                {status.spreadsheetTitle || "Google Sheet"}
              </p>
              <p className="truncate font-mono text-xs text-muted-foreground" title={status.spreadsheetId}>
                {status.spreadsheetId}
              </p>
            </div>
            <a
              href={status.spreadsheetUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1 font-medium whitespace-nowrap text-primary hover:underline"
            >
              Open sheet <ExternalLink aria-hidden className="size-3.5" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>
        )}

        {status?.tabs?.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Required tabs</h3>
            <ul className="divide-y overflow-hidden rounded-lg border bg-card">
              {status.tabs.map((tab: any) => {
                const ready = tab.exists && tab.missingColumns.length === 0;
                return (
                  <li key={tab.name} className="flex items-start justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="truncate font-mono text-sm font-medium text-foreground" title={tab.name}>
                        {tab.name}
                      </p>
                      {ready ? (
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {tab.rowCount} row{tab.rowCount === 1 ? "" : "s"}
                        </p>
                      ) : (
                        <p className="text-xs break-words text-warning">
                          {!tab.exists ? "Tab is missing." : `Missing columns: ${tab.missingColumns.join(", ")}`}
                        </p>
                      )}
                    </div>
                    {ready ? (
                      <Badge variant="outline" className="shrink-0 gap-1 border-success/20 bg-success/10 text-success">
                        <CheckCircle2 aria-hidden className="size-3" /> Ready
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0 gap-1 border-warning/20 bg-warning/10 text-warning">
                        <AlertCircle aria-hidden className="size-3" /> Needs setup
                      </Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </ResponsiveModal>
  );
}

