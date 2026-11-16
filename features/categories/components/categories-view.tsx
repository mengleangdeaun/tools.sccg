"use client";

import React, { useState } from "react";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { useAssets } from "@/context/assets-context";
import { useAuth } from "@/context/auth-context";
import { AssetCategory } from "@/lib/types";
import { errorText, request } from "@/lib/request";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CONTROL_HEIGHT, Field, FormFooter } from "@/components/ui/form-layout";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { PageHeader } from "@/components/shared/page-header";
import { ActionButton } from "@/components/shared/action-button";
import { NoData } from "@/components/shared/empty-state";
import { useConfirm } from "@/components/shared/confirm-dialog";

const EMPTY = { name: "", prefix: "", description: "" };

export function CategoriesView() {
  const { categories, assets, refreshData, showToast } = useAssets();
  const { can } = useAuth();
  const confirm = useConfirm();
  const canManage = can("categories.manage");

  const [editing, setEditing] = useState<AssetCategory | "new" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countFor = (id: string) => assets.filter((a) => a.category_id === id).length;

  const openForm = (cat: AssetCategory | "new") => {
    setForm(cat === "new" ? EMPTY : { name: cat.name, prefix: cat.prefix, description: cat.description });
    setError(null);
    setEditing(cat);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = editing === "new";
    try {
      setIsSubmitting(true);
      setError(null);
      await request(
        "/api/categories",
        { method: "POST", body: JSON.stringify({ ...form, id: isNew ? undefined : editing?.id }) },
        "Failed to save category"
      );
      setEditing(null);
      showToast(isNew ? "Category created" : "Category updated");
      await refreshData();
    } catch (err: unknown) {
      setError(errorText(err, "Failed to save category"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (cat: AssetCategory) => {
    const count = countFor(cat.id);
    if (count > 0) {
      showToast(`${count} asset${count === 1 ? " uses" : "s use"} "${cat.name}". Move ${count === 1 ? "it" : "them"} to another category first.`);
      return;
    }
    const ok = await confirm({
      title: `Archive "${cat.name}"?`,
      description: "It disappears from pickers and filters. The row stays in the sheet, so it can be restored there.",
      confirmLabel: "Archive",
    });
    if (!ok) return;
    try {
      await request(`/api/categories?id=${encodeURIComponent(cat.id)}`, { method: "DELETE" }, "Failed to archive category");
      showToast("Category archived");
      await refreshData();
    } catch (err: unknown) {
      showToast(errorText(err, "Failed to archive category"));
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Asset categories"
        description="Asset types and the tag prefix each one uses for new barcodes."
        actions={
          canManage && (
            <Button size="sm" onClick={() => openForm("new")}>
              <Plus />
              Add category
            </Button>
          )
        }
      />

      {categories.length === 0 ? (
        <Card className="p-0">
          <NoData icon={<Tags />} title="No categories yet" description="Add a category to group assets and set their tag prefix." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const count = countFor(cat.id);
            return (
              <Card key={cat.id} className="gap-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-sm font-semibold text-foreground">{cat.name}</h3>
                  <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                    {cat.prefix || "AST-"}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{cat.description || "No description."}</p>
                <div className="flex items-center justify-between gap-2 border-t pt-2">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {count} asset{count === 1 ? "" : "s"}
                  </span>
                  {canManage && (
                    <div className="-my-1 flex items-center gap-1">
                      <ActionButton icon={<Pencil />} label={`Edit ${cat.name}`} onClick={() => openForm(cat)} />
                      <ActionButton icon={<Trash2 />} label={`Archive ${cat.name}`} onClick={() => handleArchive(cat)} />
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ResponsiveModal
        open={editing !== null}
        onOpenChange={(open: boolean) => !open && setEditing(null)}
        title={editing === "new" ? "Add asset category" : "Edit asset category"}
        description="The prefix applies to tags generated from now on; existing tags keep theirs."
        footer={
          <FormFooter
            formId="category-form"
            error={error}
            submitting={isSubmitting}
            disabled={!form.name.trim()}
            submitLabel={editing === "new" ? "Create category" : "Save changes"}
            onCancel={() => setEditing(null)}
          />
        }
      >
        <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
          <Field label="Category name" htmlFor="cat-name" required>
            <Input id="cat-name" placeholder="e.g. Laptops, Audio gear" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={CONTROL_HEIGHT} required />
          </Field>
          <Field label="Barcode prefix" htmlFor="cat-prefix" hint="Defaults to AST-">
            <Input id="cat-prefix" placeholder="e.g. AST-LP-" value={form.prefix} onChange={(e) => setForm({ ...form, prefix: e.target.value })} className={`${CONTROL_HEIGHT} font-mono`} />
          </Field>
          <Field label="Description" htmlFor="cat-desc">
            <Input id="cat-desc" placeholder="Short description of items in this category" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={CONTROL_HEIGHT} />
          </Field>
        </form>
      </ResponsiveModal>
    </div>
  );
}
