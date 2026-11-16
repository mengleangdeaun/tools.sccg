"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Html5Qrcode } from "html5-qrcode";
import { AlertCircle, RefreshCw, Search } from "lucide-react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { CONTROL_HEIGHT } from "@/components/ui/form-layout";
import { useAssets } from "@/context/assets-context";
import { Asset } from "@/lib/types";

type CameraState = { kind: "starting" } | { kind: "live" } | { kind: "error"; message: string };

/** Turns a getUserMedia / html5-qrcode failure into something a person can act on. */
function cameraErrorMessage(err: unknown): string {
  const text = `${(err as { name?: string })?.name ?? ""} ${String(err)}`;
  if (/NotAllowed|Permission|SecurityError/i.test(text)) {
    return "Camera access is blocked. Allow it in your browser's site settings (the lock icon next to the address), then try again.";
  }
  if (/NotFound|Overconstrained|Requested device not found/i.test(text)) return "No camera found. Type the tag below.";
  if (/NotReadable|Could not start video source|TrackStart/i.test(text)) {
    return "The camera is being used by another app. Close it and try again.";
  }
  return "The camera could not start. Try again, or type the tag below.";
}

/** Reads the asset id from a scanned label URL (?item=…), or returns the raw text (a tag or serial). */
function scannedKey(text: string): string {
  try {
    return new URL(text).searchParams.get("item") ?? text.trim();
  } catch {
    return text.trim();
  }
}

function findAsset(assets: Asset[], key: string): Asset | undefined {
  const k = key.toLowerCase();
  return assets.find(
    (a) => a.id.toLowerCase() === k || a.tag_code.toLowerCase() === k || (a.serial_number && a.serial_number.toLowerCase() === k)
  );
}

/**
 * Owns the camera. It is mounted only while the dialog is open, so its effect runs after its own
 * element exists, and unmounting always stops the camera (the light turns off).
 * `onScan` returns true when the code matched, which ends scanning for this opening.
 */
function CameraView({ onScan }: { onScan: (text: string) => boolean }) {
  const elementId = `qr-reader-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [state, setState] = useState<CameraState>({ kind: "starting" });
  const [attempt, setAttempt] = useState(0);
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!window.isSecureContext) {
      setState({ kind: "error", message: "The camera needs a secure (https) address. Type the tag below." });
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setState({ kind: "error", message: "This browser can't use the camera. Type the tag below." });
      return;
    }

    let scanner: Html5Qrcode | null = null;
    let cancelled = false;
    let matched = false;
    setState({ kind: "starting" });

    import("html5-qrcode")
      .then(async ({ Html5Qrcode }) => {
        if (cancelled) return;
        scanner = new Html5Qrcode(elementId, { verbose: false });
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (w, h) => {
              const side = Math.floor(Math.min(w, h) * 0.75);
              return { width: side, height: side };
            },
          },
          (text) => {
            if (matched) return;
            matched = onScanRef.current(text);
          },
          () => {} // Per-frame "no code found" noise.
        );
        if (cancelled) await scanner.stop().catch(() => {});
        else setState({ kind: "live" });
      })
      .catch((err) => {
        if (!cancelled) setState({ kind: "error", message: cameraErrorMessage(err) });
      });

    return () => {
      cancelled = true;
      const s = scanner;
      if (s?.isScanning) s.stop().then(() => s.clear()).catch(() => {});
    };
  }, [elementId, attempt]);

  return (
    <div className="relative flex min-h-70 items-center justify-center overflow-hidden rounded-lg border bg-zinc-950 text-zinc-100">
      <div id={elementId} className="w-full [&_video]:w-full [&_video]:object-cover" />

      {state.kind === "starting" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-zinc-300">
          <Spinner />
          Starting camera…
        </div>
      )}

      {state.kind === "error" && (
        <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <AlertCircle aria-hidden className="size-8 text-amber-400" />
          <p className="max-w-xs text-sm text-zinc-200">{state.message}</p>
          <Button type="button" variant="secondary" size="sm" onClick={() => setAttempt((n) => n + 1)} className="gap-1.5">
            <RefreshCw />
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}

export function QrScannerModal() {
  const { isScannerOpen, setIsScannerOpen, assets, openDetailDrawer, showToast } = useAssets();
  const [manualCode, setManualCode] = useState("");
  const [notFound, setNotFound] = useState<string | null>(null);

  const lookUp = useCallback(
    (raw: string): boolean => {
      const key = scannedKey(raw);
      const found = findAsset(assets, key);
      if (!found) {
        setNotFound(key);
        return false;
      }
      setNotFound(null);
      setManualCode("");
      setIsScannerOpen(false); // Unmounts CameraView, which stops the camera.
      showToast(`Opened ${found.tag_code}`);
      openDetailDrawer(found);
      return true;
    },
    [assets, openDetailDrawer, setIsScannerOpen, showToast]
  );

  if (!isScannerOpen) return null;

  return (
    <ResponsiveModal
      open
      onOpenChange={(open: boolean) => {
        setIsScannerOpen(open);
        if (!open) setNotFound(null);
      }}
      title="Scan a QR code"
      description="Point your camera at an asset's QR sticker, or type its tag."
    >
      <div className="space-y-4">
        <CameraView onScan={lookUp} />

        {notFound && (
          <p role="status" className="min-w-0 truncate text-sm text-destructive" title={notFound}>
            No asset with tag “{notFound}”.
          </p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (manualCode.trim()) lookUp(manualCode);
          }}
          className="flex gap-2"
        >
          <Input
            aria-label="Tag code or serial number"
            placeholder="Or type a tag or serial, e.g. AST-10024"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className={`${CONTROL_HEIGHT} min-w-0 font-mono`}
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
