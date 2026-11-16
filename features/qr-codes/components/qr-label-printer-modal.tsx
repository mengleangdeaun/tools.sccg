"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { FormActions } from "@/components/ui/form-layout";
import { Printer, X, Check, Copy } from "lucide-react";
import { Asset } from "@/lib/types";
import { useAssets } from "@/context/assets-context";

interface QrLabelProps {
  asset: Asset;
  qrDataUrl: string;
}

// Print-scale type for a 50×30mm physical sticker; exempt from the 12px on-screen text floor.
function StickerLabel({ asset, qrDataUrl }: QrLabelProps) {
  return (
    <div className="print-sticker-single border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 bg-white text-zinc-900 flex items-center justify-between gap-3 shadow-xs w-full max-w-[340px] select-none">
      <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
        <div className="flex items-center gap-1.5 mb-1">
          <img src="/assets/logo-square.svg" alt="Logo" className="h-4 w-4 object-contain" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
            SCC GROUP
          </span>
        </div>
        <p className="font-mono text-xs font-bold text-zinc-950 truncate">{asset.tag_code}</p>
        <p className="text-[11px] font-medium text-zinc-800 line-clamp-1 leading-tight">
          {asset.name}
        </p>
        {asset.serial_number && (
          <p className="text-[9px] text-zinc-500 truncate mt-0.5 font-mono">
            S/N: {asset.serial_number}
          </p>
        )}
      </div>

      <div className="shrink-0 bg-white p-1 rounded border border-zinc-100 flex items-center justify-center">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt={asset.tag_code} className="size-16 object-contain" />
        ) : (
          <div className="size-16 bg-zinc-100 animate-pulse rounded" />
        )}
      </div>
    </div>
  );
}

export function QrLabelPrinterModal() {
  const { printModalState, closePrintModal } = useAssets();
  const { open, assets, mode } = printModalState;
  const [qrMap, setQrMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || assets.length === 0) return;

    let isMounted = true;
    const generateAll = async () => {
      const map: Record<string, string> = {};
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

      for (const asset of assets) {
        try {
          // Encodes the direct URL to inspect or scan the asset
          const payload = `${baseUrl}/?item=${asset.id}`;
          const url = await QRCode.toDataURL(payload, {
            width: 200,
            margin: 1,
            color: { dark: "#000000", light: "#ffffff" },
          });
          map[asset.id] = url;
        } catch (e) {
          console.error("Failed to generate QR for", asset.tag_code, e);
        }
      }
      if (isMounted) setQrMap(map);
    };

    generateAll();
    return () => {
      isMounted = false;
    };
  }, [open, assets]);

  if (!open) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(isOpen: boolean) => !isOpen && closePrintModal()}
      size={mode === "sheet" ? "lg" : "md"}
      title={mode === "sheet" ? `Print sticker sheet (${assets.length} asset${assets.length === 1 ? "" : "s"})` : "Print QR label"}
      description={
        mode === "single"
          ? "Thermal sticker roll, 50 × 30 mm (2 × 1 in)."
          : "A4 or Letter sheet, 3 stickers per row when printed."
      }
      footer={
        <FormActions>
          <Button type="button" variant="outline" onClick={closePrintModal}>
            Close
          </Button>
          <Button type="button" onClick={handlePrint} className="gap-1.5">
            <Printer />
            Print stickers
          </Button>
        </FormActions>
      }
    >
      {/* The modal body scrolls; no inner scroll box. Print CSS lays the sheet out in 3 columns. */}
      <div className="print-area">
        {mode === "single" && assets[0] ? (
          <div className="flex justify-center py-2">
            <StickerLabel asset={assets[0]} qrDataUrl={qrMap[assets[0].id]} />
          </div>
        ) : (
          <div className="print-sheet-grid grid grid-cols-1 gap-3 sm:grid-cols-2">
            {assets.map((asset) => (
              <StickerLabel key={asset.id} asset={asset} qrDataUrl={qrMap[asset.id]} />
            ))}
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
}
