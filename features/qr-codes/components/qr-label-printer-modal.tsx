"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import { Printer } from "lucide-react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { FormActions } from "@/components/ui/form-layout";
import { Asset } from "@/lib/types";
import { useAssets } from "@/context/assets-context";

// A 100 × 100 mm label for a thermal label roll. Sized in mm so print matches the paper exactly;
// print-scale type, so it is exempt from the 12px on-screen text floor.
function QrLabel({ asset, qrSvg }: { asset: Asset; qrSvg?: string }) {
  return (
    <div className="qr-label box-border flex size-[100mm] flex-col items-center justify-center overflow-hidden bg-white p-[4mm] text-black">
      {qrSvg ? (
        // eslint-disable-next-line @next/next/no-img-element -- generated SVG data URL
        <img src={qrSvg} alt={`QR code for ${asset.tag_code}`} className="size-[64mm]" />
      ) : (
        <div className="size-[64mm] animate-pulse bg-zinc-100" />
      )}

      <p className="mt-[2mm] w-full truncate text-center font-mono text-[5.5mm] leading-tight font-bold">{asset.tag_code}</p>
      <p className="mt-[0.5mm] line-clamp-2 w-full text-center text-[3.6mm] leading-[1.2] font-medium break-words">{asset.name}</p>
      {asset.serial_number && (
        <p className="mt-[0.5mm] w-full truncate text-center font-mono text-[3mm] text-zinc-700">S/N {asset.serial_number}</p>
      )}
    </div>
  );
}

export function QrLabelPrinterModal() {
  const { printModalState, closePrintModal } = useAssets();
  const { open, assets } = printModalState;
  const [qrMap, setQrMap] = useState<Record<string, string>>({});

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

  return (
    <>
      <ResponsiveModal
        open={open}
        onOpenChange={(isOpen: boolean) => !isOpen && closePrintModal()}
        size={count > 1 ? "lg" : "md"}
        title={count > 1 ? `Print ${count} QR labels` : "Print QR label"}
        description="100 × 100 mm label roll · one label per page."
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
                {ready ? `Print ${count} label${count === 1 ? "" : "s"}` : "Preparing labels..."}
              </Button>
            </FormActions>
          </div>
        }
      >
        {/* Preview: the real label, scaled down with CSS zoom so mm sizes stay true to print. */}
        <div className={count > 1 ? "grid grid-cols-1 justify-items-center gap-4 sm:grid-cols-2" : "flex justify-center"}>
          {assets.map((asset) => (
            <div key={asset.id} className="rounded-sm shadow-sm ring-1 ring-border [zoom:0.62]">
              <QrLabel asset={asset} qrSvg={qrMap[asset.id]} />
            </div>
          ))}
        </div>
      </ResponsiveModal>

      {/* Print-only copy, a direct child of <body>; print CSS hides everything else. */}
      {createPortal(
        <div id="print-root">
          {assets.map((asset) => (
            <QrLabel key={asset.id} asset={asset} qrSvg={qrMap[asset.id]} />
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
