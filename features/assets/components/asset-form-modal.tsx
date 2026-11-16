"use client";

import React, { useEffect, useState } from "react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { ResponsiveDatePicker } from "@/components/ui/responsive-date-picker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CONTROL_HEIGHT, Field, FieldRow, FormFooter, FormSection } from "@/components/ui/form-layout";
import { useAssets } from "@/context/assets-context";
import { errorText } from "@/lib/request";
import { AssetCondition, AssetStatus } from "@/lib/types";

const STATUS_OPTIONS = [
  { value: "Available", label: "Available" },
  { value: "Assigned", label: "Assigned" },
  { value: "Maintenance", label: "Maintenance" },
  { value: "Reserved", label: "Reserved" },
  { value: "Retired", label: "Retired" },
  { value: "Lost", label: "Lost / Missing" },
] as const;

const CONDITION_OPTIONS = [
  { value: "Brand New", label: "Brand new" },
  { value: "Good", label: "Good (normal wear)" },
  { value: "Fair", label: "Fair (noticeable wear)" },
  { value: "Damaged", label: "Damaged (needs repair)" },
] as const;

const FORM_ID = "asset-form";

export function AssetFormModal() {
  const { assetModalState, closeAssetModal, categories, locations, onSaveAsset } = useAssets();
  const { open, asset } = assetModalState;

  const [name, setName] = useState("");
  const [tagCode, setTagCode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [status, setStatus] = useState<AssetStatus>("Available");
  const [condition, setCondition] = useState<AssetCondition>("Good");
  const [locationId, setLocationId] = useState("");
  const [department, setDepartment] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [supplier, setSupplier] = useState("");
  const [warrantyExpiry, setWarrantyExpiry] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    if (asset) {
      setName(asset.name || "");
      setTagCode(asset.tag_code || "");
      setCategoryId(asset.category_id || "");
      setBrand(asset.brand || "");
      setModel(asset.model || "");
      setSerialNumber(asset.serial_number || "");
      setStatus(asset.status || "Available");
      setCondition(asset.condition || "Good");
      setLocationId(asset.location_id || "");
      setDepartment(asset.department || "");
      setPurchaseDate(asset.purchase_date || "");
      setPurchasePrice(asset.purchase_price || "");
      setSupplier(asset.supplier || "");
      setWarrantyExpiry(asset.warranty_expiry || "");
      setNotes(asset.notes || "");
    } else {
      setName("");
      setTagCode("");
      setCategoryId(categories[0]?.id || "");
      setBrand("");
      setModel("");
      setSerialNumber("");
      setStatus("Available");
      setCondition("Brand New");
      setLocationId(locations[0]?.id || "");
      setDepartment("");
      setPurchaseDate(new Date().toISOString().slice(0, 10));
      setPurchasePrice("");
      setSupplier("");
      setWarrantyExpiry("");
      setNotes("");
    }
  }, [asset, open, categories, locations]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setIsSubmitting(true);
      setError(null);
      await onSaveAsset({
        id: asset?.id,
        name: name.trim(),
        tag_code: tagCode.trim() || undefined,
        category_id: categoryId,
        brand: brand.trim(),
        model: model.trim(),
        serial_number: serialNumber.trim(),
        status,
        condition,
        location_id: locationId,
        department: department.trim(),
        purchase_date: purchaseDate,
        purchase_price: purchasePrice.trim(),
        supplier: supplier.trim(),
        warranty_expiry: warrantyExpiry,
        notes: notes.trim(),
      });
      closeAssetModal();
    } catch (err: unknown) {
      setError(errorText(err, "Failed to save asset"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(isOpen: boolean) => !isOpen && closeAssetModal()}
      size="lg"
      title={asset ? "Edit asset" : "Register asset"}
      description={asset ? `${asset.tag_code} · ${asset.name}` : "Add a device or piece of equipment to the inventory."}
      footer={
        <FormFooter
          formId={FORM_ID}
          error={error}
          submitting={isSubmitting}
          disabled={!name.trim()}
          submitLabel={asset ? "Save changes" : "Register asset"}
          onCancel={closeAssetModal}
        />
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-6">
        <FormSection title="Identity">
          <Field label="Asset name" htmlFor="asset-name" required>
            <Input id="asset-name" placeholder="e.g. MacBook Pro 16 M3 Max" value={name} onChange={(e) => setName(e.target.value)} className={CONTROL_HEIGHT} required />
          </Field>
          <FieldRow>
            <Field label="Tag code" htmlFor="asset-tag" hint="Blank = auto">
              <Input id="asset-tag" placeholder="e.g. AST-LP-104233" value={tagCode} onChange={(e) => setTagCode(e.target.value)} className={`${CONTROL_HEIGHT} font-mono`} />
            </Field>
            <Field label="Category" htmlFor="asset-category">
              <ResponsiveSelect
                id="asset-category"
                value={categoryId}
                onValueChange={setCategoryId}
                options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
                placeholder="Select a category"
                className={`${CONTROL_HEIGHT} w-full`}
              />
            </Field>
          </FieldRow>
        </FormSection>

        <FormSection title="Hardware">
          <FieldRow columns={3}>
            <Field label="Brand" htmlFor="asset-brand">
              <Input id="asset-brand" placeholder="e.g. Apple" value={brand} onChange={(e) => setBrand(e.target.value)} className={CONTROL_HEIGHT} />
            </Field>
            <Field label="Model" htmlFor="asset-model">
              <Input id="asset-model" placeholder="e.g. A2991" value={model} onChange={(e) => setModel(e.target.value)} className={CONTROL_HEIGHT} />
            </Field>
            <Field label="Serial number" htmlFor="asset-serial">
              <Input id="asset-serial" placeholder="e.g. C02XK1ABJG5H" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className={`${CONTROL_HEIGHT} font-mono`} />
            </Field>
          </FieldRow>
        </FormSection>

        <FormSection title="Status & location">
          <FieldRow columns={3}>
            <Field label="Status" htmlFor="asset-status">
              <ResponsiveSelect id="asset-status" value={status} onValueChange={(val) => setStatus(val as AssetStatus)} options={STATUS_OPTIONS} className={`${CONTROL_HEIGHT} w-full`} />
            </Field>
            <Field label="Condition" htmlFor="asset-condition">
              <ResponsiveSelect id="asset-condition" value={condition} onValueChange={(val) => setCondition(val as AssetCondition)} options={CONDITION_OPTIONS} className={`${CONTROL_HEIGHT} w-full`} />
            </Field>
            <Field label="Location" htmlFor="asset-location">
              <ResponsiveSelect
                id="asset-location"
                value={locationId}
                onValueChange={setLocationId}
                options={locations.map((loc) => ({ value: loc.id, label: loc.name }))}
                placeholder="Select a location"
                className={`${CONTROL_HEIGHT} w-full`}
              />
            </Field>
          </FieldRow>
        </FormSection>

        <FormSection title="Purchase">
          <FieldRow columns={3}>
            <Field label="Price (USD)" htmlFor="asset-price">
              <Input id="asset-price" type="number" inputMode="decimal" step="0.01" min="0" placeholder="0.00" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className={CONTROL_HEIGHT} />
            </Field>
            <Field label="Purchase date" htmlFor="asset-purchased">
              <ResponsiveDatePicker id="asset-purchased" value={purchaseDate} onChange={setPurchaseDate} placeholder="Pick a date" className={`${CONTROL_HEIGHT} w-full`} />
            </Field>
            <Field label="Warranty expiry" htmlFor="asset-warranty">
              <ResponsiveDatePicker id="asset-warranty" value={warrantyExpiry} onChange={setWarrantyExpiry} placeholder="Pick a date" className={`${CONTROL_HEIGHT} w-full`} />
            </Field>
          </FieldRow>
        </FormSection>

        <Field label="Specifications & notes" htmlFor="asset-notes">
          <Textarea id="asset-notes" placeholder="e.g. 36 GB RAM, 1 TB SSD, bought from Apple Store" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="resize-none" />
        </Field>
      </form>
    </ResponsiveModal>
  );
}
