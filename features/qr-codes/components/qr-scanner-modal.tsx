"use client";

import React, { useEffect, useRef, useState } from "react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CONTROL_HEIGHT } from "@/components/ui/form-layout";
import { Camera, Search, QrCode, AlertCircle } from "lucide-react";
import { useAssets } from "@/context/assets-context";

export function QrScannerModal() {
  const { isScannerOpen, setIsScannerOpen, assets, openDetailDrawer, showToast } = useAssets();
  const [manualCode, setManualCode] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const scannerRef = useRef<any>(null);

  const handleScanSuccess = (decodedText: string) => {
    // If text contains a URL with ?item=..., extract it
    let matchedId = decodedText.trim();
    try {
      const url = new URL(decodedText);
      const param = url.searchParams.get("item");
      if (param) matchedId = param;
    } catch {
      // not a full URL, treat as raw tag or id
    }

    const found = assets.find(
      (a) =>
        a.id.toLowerCase() === matchedId.toLowerCase() ||
        a.tag_code.toLowerCase() === matchedId.toLowerCase() ||
        (a.serial_number && a.serial_number.toLowerCase() === matchedId.toLowerCase())
    );

    if (found) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
      setIsScannerOpen(false);
      showToast(`Asset matched: ${found.name}`);
      openDetailDrawer(found);
    } else {
      showToast(`Scanned tag "${matchedId}" not found in inventory`);
    }
  };

  useEffect(() => {
    if (!isScannerOpen) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
      setScannerActive(false);
      setCameraError(null);
      return;
    }

    let isMounted = true;
    import("html5-qrcode")
      .then(({ Html5QrcodeScanner }) => {
        if (!isMounted) return;
        try {
          const scanner = new Html5QrcodeScanner(
            "reader",
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              rememberLastUsedCamera: true,
            },
            false
          );
          scannerRef.current = scanner;
          scanner.render(handleScanSuccess, (err) => {
            // Ignore ongoing frame search errors
          });
          setScannerActive(true);
        } catch (e: any) {
          setCameraError(e?.message || "Camera access denied or unavailable");
        }
      })
      .catch((err) => {
        setCameraError("Camera scanner module unavailable.");
      });

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [isScannerOpen]);

  const handleManualLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleScanSuccess(manualCode);
  };

  return (
    <ResponsiveModal
      open={isScannerOpen}
      onOpenChange={setIsScannerOpen}
      title="Scan a QR code"
      description="Point your camera at an asset's QR sticker, or type its tag."
    >
      <div className="space-y-4">
        {/* Camera Viewport */}
        <div className="relative min-h-[280px] bg-zinc-950 rounded-lg overflow-hidden flex flex-col items-center justify-center border text-zinc-100">
          <div id="reader" className="w-full max-w-sm rounded-lg overflow-hidden" />
          {cameraError && (
            <div className="p-4 text-center space-y-2">
              <AlertCircle className="mx-auto size-8 text-amber-400" />
              <p className="text-sm text-zinc-300">{cameraError}</p>
              <p className="text-xs text-zinc-400">
                You can still look up assets by tag code below.
              </p>
            </div>
          )}
        </div>

        {/* Manual Input Fallback */}
        <form onSubmit={handleManualLookup} className="flex gap-2">
          <Input
            aria-label="Tag code or serial number"
            placeholder="Or type a tag or serial, e.g. AST-10024"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className={`${CONTROL_HEIGHT} font-mono`}
          />
          <Button type="submit" className={`${CONTROL_HEIGHT} shrink-0 gap-1.5 px-3`}>
            <Search />
            Look up
          </Button>
        </form>
      </div>
    </ResponsiveModal>
  );
}

