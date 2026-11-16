"use client";

import React, { useState } from "react";
import { useAssets } from "@/context/assets-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, QrCode, Search, ScanLine } from "lucide-react";

export function QrScannerView() {
  const { assets, openDetailDrawer, setIsScannerOpen, showToast } = useAssets();
  const [tagInput, setTagInput] = useState("");

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const q = tagInput.trim().toLowerCase();
    if (!q) return;

    const found = assets.find(
      (a) =>
        a.tag_code.toLowerCase() === q ||
        a.id.toLowerCase() === q ||
        (a.serial_number && a.serial_number.toLowerCase() === q)
    );

    if (found) {
      showToast(`Asset matched: ${found.name}`);
      openDetailDrawer(found);
    } else {
      showToast(`No asset found with tag or serial "${tagInput}"`);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pt-4">
      <div className="text-center space-y-2">
        <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <ScanLine className="size-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Barcode scanner</h1>
        <p className="text-sm text-muted-foreground">
          Scan the QR sticker on a device with your camera, or type its tag.
        </p>
      </div>

      <div className="border rounded-xl p-6 bg-card space-y-4 shadow-xs">
        <Button
          onClick={() => setIsScannerOpen(true)}
          className="h-12 w-full gap-2 font-semibold shadow-xs"
        >
          <Camera className="size-5" />
          Open camera scanner
        </Button>

        <div className="relative flex items-center justify-center text-sm text-muted-foreground my-2">
          <span className="bg-card px-2">or enter a tag manually</span>
        </div>

        <form onSubmit={handleLookup} className="flex gap-2">
          <Input
            aria-label="Tag code or serial number"
            placeholder="e.g. AST-10024 or serial number"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            className="h-10 font-mono"
          />
          <Button type="submit" className="h-10 gap-1.5 px-4">
            <Search />
            Lookup
          </Button>
        </form>
      </div>
    </div>
  );
}

