"use client";

import React, { useState } from "react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { ResponsiveDatePicker } from "@/components/ui/responsive-date-picker";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CONTROL_HEIGHT, Field, FieldRow, FormFooter } from "@/components/ui/form-layout";
import { useAssets } from "@/context/assets-context";
import { errorText } from "@/lib/request";
import { Asset } from "@/lib/types";

const FORM_ID = "checkout-form";

export function CheckoutModal() {
  const { checkoutModalState } = useAssets();
  const { open, asset } = checkoutModalState;
  if (!open || !asset) return null;
  // Keyed by asset, so every opening starts with an empty form.
  return <CheckoutForm key={asset.id} asset={asset} />;
}

function CheckoutForm({ asset }: { asset: Asset }) {
  const { closeCheckoutModal, people, onCheckout } = useAssets();
  const [custodianEmail, setCustodianEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custodianEmail.trim()) {
      setError("Choose who is receiving the asset.");
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      await onCheckout({
        asset_id: asset.id,
        custodian_email: custodianEmail.trim(),
        department: department.trim() || undefined,
        expected_return: expectedReturn || undefined,
        notes: notes.trim() || undefined,
      });
      closeCheckoutModal();
    } catch (err: unknown) {
      setError(errorText(err, "Failed to check out the asset"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveModal
      open
      onOpenChange={(isOpen: boolean) => !isOpen && closeCheckoutModal()}
      title={`Check out ${asset.tag_code}`}
      description={`Hand ${asset.name} to an employee.`}
      footer={
        <FormFooter
          formId={FORM_ID}
          error={error}
          submitting={isSubmitting}
          disabled={!custodianEmail}
          submitLabel="Check out"
          onCancel={closeCheckoutModal}
        />
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
        <Field label="Custodian" htmlFor="checkout-custodian" required>
          <SearchableSelect
            id="checkout-custodian"
            value={custodianEmail}
            onValueChange={(val) => {
              setCustodianEmail(val);
              const person = people.find((p) => p.email === val);
              if (person?.department) setDepartment(person.department);
            }}
            options={people
              .filter((p) => p.status !== "inactive")
              .map((p) => ({ value: p.email, label: `${p.name || p.email} (${p.email})`, hint: p.department || undefined }))}
            placeholder="Search or select a person"
            searchPlaceholder="Type a name or email"
            className={CONTROL_HEIGHT}
          />
        </Field>
        <FieldRow>
          <Field label="Department" htmlFor="checkout-dept">
            <Input id="checkout-dept" placeholder="e.g. Design" value={department} onChange={(e) => setDepartment(e.target.value)} className={CONTROL_HEIGHT} />
          </Field>
          <Field label="Expected return" htmlFor="checkout-return">
            <ResponsiveDatePicker id="checkout-return" value={expectedReturn} onChange={setExpectedReturn} placeholder="Pick a date" className={`${CONTROL_HEIGHT} w-full`} />
          </Field>
        </FieldRow>
        <Field label="Handover notes" htmlFor="checkout-notes" hint="Accessories, condition">
          <Textarea id="checkout-notes" placeholder="e.g. Charger and sleeve included, screen clean" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="resize-none" />
        </Field>
      </form>
    </ResponsiveModal>
  );
}
