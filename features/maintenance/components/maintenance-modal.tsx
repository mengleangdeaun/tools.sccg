"use client";

import React, { useState } from "react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { ResponsiveDatePicker } from "@/components/ui/responsive-date-picker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CONTROL_HEIGHT, Field, FieldRow, FormFooter } from "@/components/ui/form-layout";
import { useAssets } from "@/context/assets-context";
import { errorText } from "@/lib/request";
import { Asset } from "@/lib/types";

const SERVICE_TYPE_OPTIONS = [
  { value: "Repair", label: "Hardware repair" },
  { value: "Screen Replacement", label: "Screen replacement" },
  { value: "Battery Replacement", label: "Battery replacement" },
  { value: "Routine Inspection", label: "Routine inspection & cleaning" },
  { value: "Hardware Upgrade", label: "Hardware upgrade (RAM/SSD)" },
  { value: "Calibration", label: "Calibration / testing" },
];

const FORM_ID = "maintenance-form";

export function MaintenanceModal() {
  const { maintenanceModalState } = useAssets();
  const { open, asset } = maintenanceModalState;
  if (!open || !asset) return null;
  // Keyed by asset, so every opening starts with a fresh form.
  return <MaintenanceForm key={asset.id} asset={asset} />;
}

function MaintenanceForm({ asset }: { asset: Asset }) {
  const { closeMaintenanceModal, onLogMaintenance } = useAssets();
  const [serviceType, setServiceType] = useState("Repair");
  const [vendor, setVendor] = useState("");
  const [cost, setCost] = useState("");
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      await onLogMaintenance({
        asset_id: asset.id,
        service_type: serviceType,
        vendor: vendor.trim(),
        cost: cost.trim() || "0",
        started_at: startedAt,
        notes: notes.trim(),
        status: "in_progress",
      });
      closeMaintenanceModal();
    } catch (err: unknown) {
      setError(errorText(err, "Failed to log maintenance"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveModal
      open
      onOpenChange={(isOpen: boolean) => !isOpen && closeMaintenanceModal()}
      title="Log maintenance"
      description={`Open a service ticket for ${asset.tag_code} · ${asset.name}.`}
      footer={<FormFooter formId={FORM_ID} error={error} submitting={isSubmitting} submitLabel="Log service" onCancel={closeMaintenanceModal} />}
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
        <FieldRow>
          <Field label="Service type" htmlFor="mnt-type">
            <ResponsiveSelect id="mnt-type" value={serviceType} onValueChange={setServiceType} options={SERVICE_TYPE_OPTIONS} className={`${CONTROL_HEIGHT} w-full`} />
          </Field>
          <Field label="Vendor" htmlFor="mnt-vendor">
            <Input id="mnt-vendor" placeholder="e.g. Apple Care, internal IT" value={vendor} onChange={(e) => setVendor(e.target.value)} className={CONTROL_HEIGHT} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="Cost (USD)" htmlFor="mnt-cost" hint="Estimate is fine">
            <Input id="mnt-cost" type="number" inputMode="decimal" step="0.01" min="0" placeholder="0.00" value={cost} onChange={(e) => setCost(e.target.value)} className={CONTROL_HEIGHT} />
          </Field>
          <Field label="Start date" htmlFor="mnt-start">
            <ResponsiveDatePicker id="mnt-start" value={startedAt} onChange={setStartedAt} placeholder="Pick a date" className={`${CONTROL_HEIGHT} w-full`} />
          </Field>
        </FieldRow>
        <Field label="Issue & notes" htmlFor="mnt-notes">
          <Textarea id="mnt-notes" placeholder="e.g. Keyboard keys sticking; replace top case" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="resize-none" />
        </Field>
      </form>
    </ResponsiveModal>
  );
}
