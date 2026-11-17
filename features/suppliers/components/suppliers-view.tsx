"use client";

import React, { useMemo, useState } from "react";
import { Download, Pencil, Plus, Trash2, Truck } from "lucide-react";
import { useAssets } from "@/context/assets-context";
import { useAuth } from "@/context/auth-context";
import { Asset, AssetSupplier } from "@/lib/types";
import { errorText, request } from "@/lib/request";
import { formatCurrency } from "@/lib/format";
import { formatDisplayDate } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { CONTROL_HEIGHT, Field, FieldRow, FormFooter } from "@/components/ui/form-layout";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { PageHeader } from "@/components/shared/page-header";
import { ActionButton } from "@/components/shared/action-button";
import { NoData } from "@/components/shared/empty-state";
import { useConfirm } from "@/components/shared/confirm-dialog";

const EMPTY = { name: "", contact_name: "", phone: "", email: "", address: "", notes: "" };
type FormState = typeof EMPTY;

const price = (a: Asset) => parseFloat(a.purchase_price) || 0;
const sum = (items: Asset[]) => items.reduce((total, a) => total + price(a), 0);

export function SuppliersView() {
  const { suppliers, assets, refreshData, showToast, openDetailDrawer } = useAssets();
  const { can } = useAuth();
  const confirm = useConfirm();
  const canManage = can("suppliers.manage");

  const [editing, setEditing] = useState<AssetSupplier | "new" | null>(null);
  const [viewing, setViewing] = useState<AssetSupplier | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);

  const assetsBySupplier = useMemo(() => {
    const map = new Map<string, Asset[]>();
    for (const a of assets) if (a.supplier_id) map.set(a.supplier_id, [...(map.get(a.supplier_id) ?? []), a]);
    return map;
  }, [assets]);
  const legacyCount = assets.filter((a) => !a.supplier_id && a.supplier?.trim()).length;

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const openForm = (s: AssetSupplier | "new") => {
    setForm(
      s === "new"
        ? EMPTY
        : { name: s.name, contact_name: s.contact_name, phone: s.phone, email: s.email, address: s.address, notes: s.notes }
    );
    setError(null);
    setEditing(s);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = editing === "new";
    try {
      setIsSubmitting(true);
      setError(null);
      await request(
        "/api/suppliers",
        { method: "POST", body: JSON.stringify({ ...form, id: isNew ? undefined : editing?.id }) },
        "Failed to save supplier"
      );
      setEditing(null);
      showToast(isNew ? "Supplier added" : "Supplier updated");
      await refreshData();
    } catch (err: unknown) {
      setError(errorText(err, "Failed to save supplier"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (s: AssetSupplier) => {
    const count = assetsBySupplier.get(s.id)?.length ?? 0;
    if (count > 0) {
      showToast(`${count} asset${count === 1 ? " is" : "s are"} linked to "${s.name}". Change ${count === 1 ? "its" : "their"} supplier first.`);
      return;
    }
    const ok = await confirm({
      title: `Archive "${s.name}"?`,
      description: "It disappears from pickers. The row stays in the sheet, so it can be restored there.",
      confirmLabel: "Archive",
    });
    if (!ok) return;
    try {
      await request(`/api/suppliers?id=${encodeURIComponent(s.id)}`, { method: "DELETE" }, "Failed to archive supplier");
      showToast("Supplier archived");
      await refreshData();
    } catch (err: unknown) {
      showToast(errorText(err, "Failed to archive supplier"));
    }
  };

  const handleImport = async () => {
    try {
      setImporting(true);
      const res = await request<{ created: number; linked: number }>("/api/suppliers?action=import", { method: "POST" }, "Failed to import suppliers");
      showToast(`Created ${res.created} supplier${res.created === 1 ? "" : "s"}, linked ${res.linked} asset${res.linked === 1 ? "" : "s"}`);
      await refreshData();
    } catch (err: unknown) {
      showToast(errorText(err, "Failed to import suppliers"));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Suppliers"
        description="Vendors you buy assets from, with what was bought on each invoice."
        actions={
          canManage && (
            <>
              {legacyCount > 0 && (
                <Button size="sm" variant="outline" onClick={handleImport} disabled={importing}>
                  <Download />
                  {importing ? "Importing..." : `Import existing names (${legacyCount})`}
                </Button>
              )}
              <Button size="sm" onClick={() => openForm("new")}>
                <Plus />
                Add supplier
              </Button>
            </>
          )
        }
      />

      {suppliers.length === 0 ? (
        <Card className="p-0">
          <NoData icon={<Truck />} title="No suppliers yet" description="Add the vendors you buy assets from." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => {
            const items = assetsBySupplier.get(s.id) ?? [];
            return (
              <Card key={s.id} className="gap-2 p-4">
                <button type="button" onClick={() => setViewing(s)} className="space-y-2 text-left outline-none focus-visible:underline">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Truck className="size-4 shrink-0 text-primary" />
                    <span className="truncate">{s.name}</span>
                  </h3>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
                    <dt className="text-muted-foreground">Contact</dt>
                    <dd className="min-w-0 break-words text-foreground">{s.contact_name || "—"}</dd>
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd className="min-w-0 break-words text-foreground">{s.phone || "—"}</dd>
                  </dl>
                </button>
                <div className="flex items-center justify-between gap-2 border-t pt-2">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {items.length} asset{items.length === 1 ? "" : "s"} · {formatCurrency(sum(items))}
                  </span>
                  {canManage && (
                    <div className="-my-1 flex items-center gap-1">
                      <ActionButton icon={<Pencil />} label={`Edit ${s.name}`} onClick={() => openForm(s)} />
                      <ActionButton icon={<Trash2 />} label={`Archive ${s.name}`} onClick={() => handleArchive(s)} />
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {viewing && (
        <SupplierDetail
          supplier={viewing}
          items={assetsBySupplier.get(viewing.id) ?? []}
          onClose={() => setViewing(null)}
          onOpenAsset={(a) => {
            setViewing(null);
            openDetailDrawer(a);
          }}
        />
      )}

      <ResponsiveModal
        open={editing !== null}
        onOpenChange={(open: boolean) => !open && setEditing(null)}
        title={editing === "new" ? "Add supplier" : "Edit supplier"}
        description="A vendor you buy assets from."
        footer={
          <FormFooter
            formId="supplier-form"
            error={error}
            submitting={isSubmitting}
            disabled={!form.name.trim()}
            submitLabel={editing === "new" ? "Add supplier" : "Save changes"}
            onCancel={() => setEditing(null)}
          />
        }
      >
        <form id="supplier-form" onSubmit={handleSubmit} className="space-y-4">
          <Field label="Supplier name" htmlFor="sup-name" required>
            <Input id="sup-name" placeholder="e.g. Sok Sabay Computer Co., Ltd." value={form.name} onChange={set("name")} className={CONTROL_HEIGHT} required />
          </Field>
          <FieldRow>
            <Field label="Contact person" htmlFor="sup-contact">
              <Input id="sup-contact" placeholder="e.g. Sok Sabay" value={form.contact_name} onChange={set("contact_name")} className={CONTROL_HEIGHT} />
            </Field>
            <Field label="Phone" htmlFor="sup-phone">
              <Input id="sup-phone" type="tel" placeholder="e.g. 012345678" value={form.phone} onChange={set("phone")} className={CONTROL_HEIGHT} />
            </Field>
          </FieldRow>
          <Field label="Email" htmlFor="sup-email">
            <Input id="sup-email" type="email" placeholder="soksabay@tech.com" value={form.email} onChange={set("email")} className={CONTROL_HEIGHT} />
          </Field>
          <Field label="Address" htmlFor="sup-address">
            <Textarea id="sup-address" rows={2} value={form.address} onChange={set("address")} className="resize-none" />
          </Field>
          <Field label="Notes" htmlFor="sup-notes">
            <Textarea id="sup-notes" rows={2} placeholder="e.g. Warranty claims via the service centre" value={form.notes} onChange={set("notes")} className="resize-none" />
          </Field>
        </form>
      </ResponsiveModal>
    </div>
  );
}

// Contact details plus every asset bought from this supplier, grouped by invoice.
function SupplierDetail({
  supplier,
  items,
  onClose,
  onOpenAsset,
}: {
  supplier: AssetSupplier;
  items: Asset[];
  onClose: () => void;
  onOpenAsset: (asset: Asset) => void;
}) {
  const invoices = useMemo(() => {
    const groups = new Map<string, Asset[]>();
    for (const a of items) {
      const key = a.invoice_no?.trim() || "";
      groups.set(key, [...(groups.get(key) ?? []), a]);
    }
    // Newest purchase first; assets without an invoice last.
    return [...groups].sort(([ka, a], [kb, b]) => {
      if (!ka !== !kb) return ka ? -1 : 1;
      return (b[0].purchase_date || "").localeCompare(a[0].purchase_date || "");
    });
  }, [items]);

  const contact = [supplier.contact_name, supplier.phone, supplier.email].filter(Boolean).join(" · ");

  return (
    <ResponsiveModal
      open
      onOpenChange={(open: boolean) => !open && onClose()}
      size="lg"
      title={supplier.name}
      description={`${items.length} asset${items.length === 1 ? "" : "s"} · ${formatCurrency(sum(items))} total`}
    >
      <div className="space-y-4">
        {(contact || supplier.address || supplier.notes) && (
          <div className="space-y-1 text-sm">
            {contact && <p className="text-foreground">{contact}</p>}
            {supplier.address && <p className="whitespace-pre-line text-muted-foreground">{supplier.address}</p>}
            {supplier.notes && <p className="whitespace-pre-line text-muted-foreground">{supplier.notes}</p>}
          </div>
        )}

        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No assets linked to this supplier yet.</p>
        ) : (
          invoices.map(([invoice, list]) => (
            <section key={invoice || "none"} className="rounded-md border">
              <header className="flex flex-wrap items-baseline justify-between gap-2 border-b bg-muted/40 px-3 py-2 text-sm">
                <span className="font-mono font-semibold text-foreground">{invoice || "No invoice"}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {list[0].purchase_date ? `${formatDisplayDate(list[0].purchase_date)} · ` : ""}
                  {list.length} item{list.length === 1 ? "" : "s"} · {formatCurrency(sum(list))}
                </span>
              </header>
              <ul className="divide-y">
                {list.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => onOpenAsset(a)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm outline-none hover:bg-muted/50 focus-visible:bg-muted/50"
                    >
                      <span className="w-32 shrink-0 truncate font-mono text-xs text-muted-foreground">{a.tag_code}</span>
                      <span className="min-w-0 flex-1 truncate text-foreground">{a.name}</span>
                      <span className="shrink-0 text-muted-foreground tabular-nums">{a.purchase_price ? formatCurrency(price(a)) : "—"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </ResponsiveModal>
  );
}
