"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { ResponsiveDatePicker } from "@/components/ui/responsive-date-picker";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CONTROL_HEIGHT, Field, FieldRow, FormFooter, FormSection } from "@/components/ui/form-layout";
import { useAssets } from "@/context/assets-context";
import { useAuth } from "@/context/auth-context";
import { errorText, request } from "@/lib/request";
import { MAX_BULK, normalizeSerials } from "@/lib/serials";
import { Asset, AssetCondition, AssetStatus, AssetSupplier } from "@/lib/types";

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

// Unique non-empty values of one asset field, for <datalist> suggestions.
const suggestionsFor = (assets: Asset[], key: "name" | "brand" | "model") =>
  [...new Set(assets.map((a) => a[key]?.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));

export function AssetFormModal() {
  const { assetModalState, closeAssetModal, assets, categories, locations, suppliers, onSaveAsset, onRegisterAssets, openPrintModal, refreshData } =
    useAssets();
  const { can } = useAuth();
  const { open, asset, template } = assetModalState;
  const source = asset ?? template;

  const [name, setName] = useState("");
  const [tagCode, setTagCode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [status, setStatus] = useState<AssetStatus>("Available");
  const [condition, setCondition] = useState<AssetCondition>("Good");
  const [locationId, setLocationId] = useState("");
  const [department, setDepartment] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [warrantyExpiry, setWarrantyExpiry] = useState("");
  const [notes, setNotes] = useState("");
  const [newSupplier, setNewSupplier] = useState<string | null>(null);
  const [addingSupplier, setAddingSupplier] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset only when the modal opens or its target changes, so a data refresh (e.g. after adding a
  // supplier) doesn't wipe what the user has typed.
  useEffect(() => {
    if (!open) return;
    setError(null);
    setNewSupplier(null);
    setQuantity("1");
    setName(source?.name || "");
    setTagCode(asset?.tag_code || "");
    setCategoryId(source?.category_id || categories[0]?.id || "");
    setBrand(source?.brand || "");
    setModel(source?.model || "");
    setSerialNumber(asset?.serial_number || "");
    setStatus(asset?.status || "Available");
    setCondition(source?.condition || "Brand New");
    setLocationId(source?.location_id || locations[0]?.id || "");
    setDepartment(source?.department || "");
    setPurchaseDate(source ? source.purchase_date || "" : new Date().toISOString().slice(0, 10));
    setPurchasePrice(source?.purchase_price || "");
    setSupplierId(source?.supplier_id || "");
    setInvoiceNo(source?.invoice_no || "");
    setWarrantyExpiry(source?.warranty_expiry || "");
    setNotes(source?.notes || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see comment above
  }, [open, asset, template]);

  const nameOptions = useMemo(() => suggestionsFor(assets, "name"), [assets]);
  const brandOptions = useMemo(() => suggestionsFor(assets, "brand"), [assets]);
  const modelOptions = useMemo(() => suggestionsFor(assets, "model"), [assets]);
  const supplierOptions = useMemo(
    () => [{ value: "", label: "No supplier" }, ...suppliers.map((s: AssetSupplier) => ({ value: s.id, label: s.name }))],
    [suppliers]
  );

  if (!open) return null;

  const isEdit = !!asset;
  const qty = isEdit ? 1 : Math.trunc(Number(quantity)) || 0;
  const bulk = qty > 1;
  const serialCheck = bulk ? normalizeSerials(serialNumber, qty) : null;
  const serialError = serialCheck?.error ?? (!isEdit && (qty < 1 || qty > MAX_BULK) ? `Quantity must be 1–${MAX_BULK}.` : null);
  // Switching back from bulk can leave several lines; a single asset uses the first.
  const singleSerial = serialNumber.split(/\r?\n/)[0].trim();

  const handleAddSupplier = async () => {
    const supplierName = newSupplier?.trim();
    if (!supplierName) return;
    try {
      setAddingSupplier(true);
      setError(null);
      const { supplier } = await request<{ supplier: AssetSupplier }>(
        "/api/suppliers",
        { method: "POST", body: JSON.stringify({ name: supplierName }) },
        "Failed to add supplier"
      );
      await refreshData();
      setSupplierId(supplier.id);
      setNewSupplier(null);
    } catch (err: unknown) {
      setError(errorText(err, "Failed to add supplier"));
    } finally {
      setAddingSupplier(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || serialError) return;
    const fields: Partial<Asset> = {
      id: asset?.id,
      name: name.trim(),
      tag_code: bulk ? undefined : tagCode.trim() || undefined,
      category_id: categoryId,
      brand: brand.trim(),
      model: model.trim(),
      serial_number: bulk ? "" : singleSerial,
      status,
      condition,
      location_id: locationId,
      department: department.trim(),
      purchase_date: purchaseDate,
      purchase_price: purchasePrice.trim(),
      supplier_id: supplierId,
      invoice_no: invoiceNo.trim(),
      warranty_expiry: warrantyExpiry,
      notes: notes.trim(),
    };
    try {
      setIsSubmitting(true);
      setError(null);
      if (isEdit) {
        await onSaveAsset(fields);
        closeAssetModal();
        return;
      }
      const created = await onRegisterAssets(fields, qty, bulk ? serialCheck!.serials : [singleSerial]);
      closeAssetModal();
      if (created.length > 1 && can("assets.print")) openPrintModal(created, "sheet");
    } catch (err: unknown) {
      setError(errorText(err, "Failed to save asset"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const legacySupplier = source && !source.supplier_id ? source.supplier : "";

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(isOpen: boolean) => !isOpen && closeAssetModal()}
      size="lg"
      title={isEdit ? "Edit asset" : template ? `Register asset (copy of ${template.tag_code})` : "Register asset"}
      description={isEdit ? `${asset.tag_code} · ${asset.name}` : "Add a device or piece of equipment to the inventory."}
      footer={
        <FormFooter
          formId={FORM_ID}
          error={error ?? serialError}
          submitting={isSubmitting}
          disabled={!name.trim() || !!serialError}
          submitLabel={isEdit ? "Save changes" : bulk ? `Register ${qty} assets` : "Register asset"}
          onCancel={closeAssetModal}
        />
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-6">
        <datalist id="asset-name-options">{nameOptions.map((v) => <option key={v} value={v} />)}</datalist>
        <datalist id="asset-brand-options">{brandOptions.map((v) => <option key={v} value={v} />)}</datalist>
        <datalist id="asset-model-options">{modelOptions.map((v) => <option key={v} value={v} />)}</datalist>

        <FormSection title="Identity">
          <Field label="Asset name" htmlFor="asset-name" required>
            <Input id="asset-name" list="asset-name-options" autoComplete="off" placeholder="e.g. MacBook Pro 16 M3 Max" value={name} onChange={(e) => setName(e.target.value)} className={CONTROL_HEIGHT} required />
          </Field>
          <FieldRow columns={isEdit ? 2 : 3}>
            {!isEdit && (
              <Field label="Quantity" htmlFor="asset-qty" hint={`Max ${MAX_BULK}`}>
                <Input id="asset-qty" type="number" inputMode="numeric" min={1} max={MAX_BULK} step={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} className={CONTROL_HEIGHT} />
              </Field>
            )}
            <Field label="Tag code" htmlFor="asset-tag" hint={bulk ? "Auto for each" : "Blank = auto"}>
              <Input id="asset-tag" placeholder={bulk ? "Generated per asset" : "e.g. AST-LP-104233"} value={bulk ? "" : tagCode} onChange={(e) => setTagCode(e.target.value)} disabled={bulk} className={`${CONTROL_HEIGHT} font-mono`} />
            </Field>
            <Field label="Category" htmlFor="asset-category">
              <SearchableSelect
                id="asset-category"
                searchPlaceholder="Search categories"
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
          <FieldRow>
            <Field label="Brand" htmlFor="asset-brand">
              <Input id="asset-brand" list="asset-brand-options" autoComplete="off" placeholder="e.g. Apple" value={brand} onChange={(e) => setBrand(e.target.value)} className={CONTROL_HEIGHT} />
            </Field>
            <Field label="Model" htmlFor="asset-model">
              <Input id="asset-model" list="asset-model-options" autoComplete="off" placeholder="e.g. A2991" value={model} onChange={(e) => setModel(e.target.value)} className={CONTROL_HEIGHT} />
            </Field>
          </FieldRow>
          {bulk ? (
            <Field
              label="Serial numbers"
              htmlFor="asset-serial"
              hint={`${serialCheck?.serials.length ?? 0} / ${qty} · one per line, or leave empty`}
            >
              <Textarea
                id="asset-serial"
                placeholder={"C02XK1ABJG5H\nC02XK1ABJG5J\n…"}
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                rows={Math.min(8, Math.max(3, qty))}
                aria-invalid={!!serialCheck?.error}
                className="resize-y font-mono"
              />
            </Field>
          ) : (
            <Field label="Serial number" htmlFor="asset-serial">
              <Input id="asset-serial" placeholder="e.g. C02XK1ABJG5H" value={serialNumber.split(/\r?\n/)[0]} onChange={(e) => setSerialNumber(e.target.value)} className={`${CONTROL_HEIGHT} font-mono`} />
            </Field>
          )}
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
              <SearchableSelect
                id="asset-location"
                searchPlaceholder="Search locations"
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
          <FieldRow>
            <Field label="Supplier" htmlFor="asset-supplier" hint={legacySupplier ? `Was “${legacySupplier}”` : undefined}>
              {newSupplier === null ? (
                <div className="flex gap-2">
                  <div className="min-w-0 flex-1">
                    <SearchableSelect
                      id="asset-supplier"
                      value={supplierId}
                      onValueChange={setSupplierId}
                      options={supplierOptions}
                      searchPlaceholder="Search suppliers"
                      className={`${CONTROL_HEIGHT} w-full`}
                    />
                  </div>
                  <Button type="button" variant="outline" size="icon" className="size-9 shrink-0" aria-label="Add a new supplier" onClick={() => setNewSupplier("")}>
                    <Plus />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    id="asset-supplier"
                    autoFocus
                    placeholder="New supplier name"
                    value={newSupplier}
                    onChange={(e) => setNewSupplier(e.target.value)}
                    onKeyDown={(e) => {
                      // Enter adds the supplier instead of submitting the whole form.
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSupplier();
                      } else if (e.key === "Escape") {
                        e.stopPropagation();
                        setNewSupplier(null);
                      }
                    }}
                    className={CONTROL_HEIGHT}
                  />
                  <Button type="button" onClick={handleAddSupplier} disabled={!newSupplier.trim() || addingSupplier} className="shrink-0">
                    {addingSupplier ? "Adding..." : "Add"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setNewSupplier(null)} className="shrink-0">
                    Cancel
                  </Button>
                </div>
              )}
            </Field>
            <Field label="Invoice no" htmlFor="asset-invoice">
              <Input id="asset-invoice" placeholder="e.g. INV-2026-0142" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className={`${CONTROL_HEIGHT} font-mono`} />
            </Field>
          </FieldRow>
          <FieldRow columns={3}>
            <Field label={bulk ? "Price each (USD)" : "Price (USD)"} htmlFor="asset-price">
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
