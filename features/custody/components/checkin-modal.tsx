"use client";

import React, { useState } from "react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { CONTROL_HEIGHT, Field, FieldRow, FormFooter } from "@/components/ui/form-layout";
import { useAssets } from "@/context/assets-context";
import { errorText } from "@/lib/request";
import { Asset } from "@/lib/types";

const RETURN_CONDITION_OPTIONS = [
  { value: "Good", label: "Good (normal wear)" },
  { value: "Brand New", label: "Brand new" },
  { value: "Fair", label: "Fair (noticeable scratches)" },
  { value: "Damaged", label: "Damaged (needs repair)" },
];

const FORM_ID = "checkin-form";

export function CheckinModal() {
  const { checkinModalState } = useAssets();
  const { open, asset } = checkinModalState;
  if (!open || !asset) return null;
  // Keyed by asset, so every opening starts with a fresh form.
  return <CheckinForm key={asset.id} asset={asset} />;
}

function CheckinForm({ asset }: { asset: Asset }) {
  const { closeCheckinModal, locations, onCheckin } = useAssets();
  const [condition, setCondition] = useState("Good");
  const [locationId, setLocationId] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      await onCheckin({
        asset_id: asset.id,
        condition,
        location_id: locationId || undefined,
        notes: notes.trim() || undefined,
      });
      closeCheckinModal();
    } catch (err: unknown) {
      setError(errorText(err, "Failed to return the asset"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveModal
      open
      onOpenChange={(isOpen: boolean) => !isOpen && closeCheckinModal()}
      title={`Check in ${asset.tag_code}`}
      description={`Return ${asset.name} from ${asset.custodian_email || "its custodian"} to stock.`}
      footer={<FormFooter formId={FORM_ID} error={error} submitting={isSubmitting} submitLabel="Return to stock" onCancel={closeCheckinModal} />}
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
        <FieldRow>
          <Field label="Returned condition" htmlFor="checkin-condition">
            <ResponsiveSelect id="checkin-condition" value={condition} onValueChange={setCondition} options={RETURN_CONDITION_OPTIONS} className={`${CONTROL_HEIGHT} w-full`} />
          </Field>
          <Field label="Return location" htmlFor="checkin-location">
            <SearchableSelect
              id="checkin-location"
              value={locationId}
              onValueChange={setLocationId}
              options={[{ value: "", label: "Keep current location" }, ...locations.map((loc) => ({ value: loc.id, label: loc.name }))]}
              searchPlaceholder="Search locations"
              className={`${CONTROL_HEIGHT} w-full`}
            />
          </Field>
        </FieldRow>
        <Field label="Inspection notes" htmlFor="checkin-notes">
          <Textarea id="checkin-notes" placeholder="e.g. Returned with charger, battery health 92%" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="resize-none" />
        </Field>
      </form>
    </ResponsiveModal>
  );
}
