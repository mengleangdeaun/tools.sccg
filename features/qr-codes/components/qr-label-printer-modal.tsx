"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import { Printer } from "lucide-react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormActions } from "@/components/ui/form-layout";
import { Asset } from "@/lib/types";
import { useAssets } from "@/context/assets-context";

type Layout = "1" | "4";

// Labels are sized in mm so print matches the paper exactly; print-scale type, so it is exempt
// from the 12px on-screen text floor. Big = 100 × 100 mm (one per page), small = 50 × 50 mm (4 per page).
function QrLabel({ asset, qrSvg, small }: { asset: Asset; qrSvg?: string; small?: boolean }) {
  const qrSize = small ? "size-[32mm]" : "size-[64mm]";
  return (
    <div
      className={`qr-label box-border flex flex-col items-center justify-center overflow-hidden bg-white text-black ${
        small ? "size-[50mm] p-[2.5mm]" : "size-[100mm] p-[4mm]"
      }`}
    >
      {qrSvg ? (
        // eslint-disable-next-line @next/next/no-img-element -- generated SVG data URL
        <img src={qrSvg} alt={`QR code for ${asset.tag_code}`} className={qrSize} />
      ) : (
        <div className={`${qrSize} animate-pulse bg-zinc-100`} />
      )}

      {small ? (
        <>
          <p className="mt-[1.2mm] w-full truncate text-center font-mono text-[3.2mm] leading-tight font-bold">{asset.tag_code}</p>
          <p className="w-full truncate text-center text-[2.4mm] leading-tight font-medium">{asset.name}</p>
        </>
      ) : (
        <>
          <p className="mt-[2mm] w-full truncate text-center font-mono text-[5.5mm] leading-tight font-bold">{asset.tag_code}</p>
          <p className="mt-[0.5mm] line-clamp-2 w-full text-center text-[3.6mm] leading-[1.2] font-medium break-words">{asset.name}</p>
          {asset.serial_number && (
            <p className="mt-[0.5mm] w-full truncate text-center font-mono text-[3mm] text-zinc-700">S/N {asset.serial_number}</p>
          )}
        </>
      )}
    </div>
  );
}

// One printed 100 × 100 mm page: a single big label, or a 2 × 2 grid of small ones.
function QrPages({ assets, qrMap, layout }: { assets: Asset[]; qrMap: Record<string, string>; layout: Layout }) {
  if (layout === "1") return assets.map((a) => <QrLabel key={a.id} asset={a} qrSvg={qrMap[a.id]} />);

  const pages: Asset[][] = [];
  for (let i = 0; i < assets.length; i += 4) pages.push(assets.slice(i, i + 4));
  return pages.map((page) => (
    <div key={page[0].id} className="qr-page box-border grid size-[100mm] grid-cols-2 grid-rows-2 bg-white">
      {page.map((a) => (
        <QrLabel key={a.id} asset={a} qrSvg={qrMap[a.id]} small />
      ))}
    </div>
  ));
}

export function QrLabelPrinterModal() {
  const { printModalState, closePrintModal } = useAssets();
  const { open, assets, mode } = printModalState;
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [layout, setLayout] = useState<Layout>("1");

  // Batch ("sheet") callers start in 4-up, single-asset callers in 1-up; the user can switch.
  useEffect(() => {
    if (open) setLayout(mode === "sheet" ? "4" : "1");
  }, [open, mode]);

  useEffect(() => {
    if (!open || assets.length === 0) return;
    let isMounted = true;

    (async () => {
      const map: Record<string, string> = {};
      for (const asset of assets) {
        try {
          // The scanner opens ?item=<id>; the payload is unchanged from earlier labels.
          const svg = await QRCode.toString(`${window.location.origin}/?item=${asset.id}`, {
            type: "svg",
            margin: 0,
            errorCorrectionLevel: "M",
            color: { dark: "#000000", light: "#ffffff" },
          });
          // SVG stays sharp at any print size, unlike the old 200px PNG.
          map[asset.id] = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        } catch (e) {
          console.error("Failed to generate QR for", asset.tag_code, e);
        }
      }
      if (isMounted) setQrMap(map);
    })();

    return () => {
      isMounted = false;
    };
  }, [open, assets]);

  if (!open) return null;

  const ready = assets.length > 0 && assets.every((a) => qrMap[a.id]);
  const count = assets.length;
  const pageCount = layout === "4" ? Math.ceil(count / 4) : count;
  const labelsText = `${count} label${count === 1 ? "" : "s"}`;

  return (
    <>
      <ResponsiveModal
        open={open}
        onOpenChange={(isOpen: boolean) => !isOpen && closePrintModal()}
        size={pageCount > 1 ? "lg" : "md"}
        title={count > 1 ? `Print ${count} QR labels` : "Print QR label"}
        description={
          layout === "4" ? "100 × 100 mm label roll · 4 labels per page (2 × 2, 50 mm each)." : "100 × 100 mm label roll · one label per page."
        }
        footer={
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              In the print dialog choose your label printer, paper 100 × 100 mm, margins None, scale 100%.
            </p>
            <FormActions>
              <Button type="button" variant="outline" onClick={closePrintModal}>
                Close
              </Button>
              <Button type="button" onClick={() => window.print()} disabled={!ready} className="gap-1.5">
                <Printer />
                {ready
                  ? `Print ${labelsText}${pageCount !== count ? ` (${pageCount} page${pageCount === 1 ? "" : "s"})` : ""}`
                  : "Preparing labels..."}
              </Button>
            </FormActions>
          </div>
        }
      >
        <div className="space-y-4">
          <Tabs value={layout} onValueChange={(v) => setLayout(v as Layout)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="1">1 per page · 100 mm</TabsTrigger>
              <TabsTrigger value="4">4 per page · 50 mm</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Preview: the real pages, scaled down with CSS zoom so mm sizes stay true to print. */}
          <div
            className={`*:rounded-sm *:shadow-sm *:ring-1 *:ring-border *:[zoom:0.62] ${
              pageCount > 1 ? "grid grid-cols-1 justify-items-center gap-4 sm:grid-cols-2" : "flex justify-center"
            }`}
          >
            <QrPages assets={assets} qrMap={qrMap} layout={layout} />
          </div>
        </div>
      </ResponsiveModal>

      {/* Print-only copy, a direct child of <body>; print CSS hides everything else. */}
      {createPortal(
        <div id="print-root">
          <QrPages assets={assets} qrMap={qrMap} layout={layout} />
        </div>,
        document.body
      )}
    </>
  );
}
