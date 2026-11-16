"use client";

import React, { useState } from "react";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useAssets } from "@/context/assets-context";
import { useAuth } from "@/context/auth-context";
import { AssetLocation } from "@/lib/types";
import { errorText, request } from "@/lib/request";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CONTROL_HEIGHT, Field, FieldRow, FormFooter } from "@/components/ui/form-layout";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { PageHeader } from "@/components/shared/page-header";
import { ActionButton } from "@/components/shared/action-button";
import { NoData } from "@/components/shared/empty-state";
import { useConfirm } from "@/components/shared/confirm-dialog";

const EMPTY = { name: "", building: "", floor: "", room: "", branch: "" };
type FormState = typeof EMPTY;

export function LocationsView() {
  const { locations, assets, refreshData, showToast } = useAssets();
  const { can } = useAuth();
  const confirm = useConfirm();
  const canManage = can("locations.manage");

  const [editing, setEditing] = useState<AssetLocation | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countFor = (id: string) => assets.filter((a) => a.location_id === id).length;
  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value });

  const openForm = (loc: AssetLocation | "new") => {
    setForm(loc === "new" ? EMPTY : { name: loc.name, building: loc.building, floor: loc.floor, room: loc.room, branch: loc.branch });
    setError(null);
    setEditing(loc);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = editing === "new";
    try {
      setIsSubmitting(true);
      setError(null);
      await request(
        "/api/locations",
        { method: "POST", body: JSON.stringify({ ...form, id: isNew ? undefined : editing?.id }) },
        "Failed to save location"
      );
      setEditing(null);
      showToast(isNew ? "Location added" : "Location updated");
      await refreshData();
    } catch (err: unknown) {
      setError(errorText(err, "Failed to save location"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (loc: AssetLocation) => {
    const count = countFor(loc.id);
    if (count > 0) {
      showToast(`${count} asset${count === 1 ? " is" : "s are"} at "${loc.name}". Move ${count === 1 ? "it" : "them"} to another location first.`);
      return;
    }
    const ok = await confirm({
      title: `Archive "${loc.name}"?`,
      description: "It disappears from pickers and filters. The row stays in the sheet, so it can be restored there.",
      confirmLabel: "Archive",
    });
    if (!ok) return;
    try {
      await request(`/api/locations?id=${encodeURIComponent(loc.id)}`, { method: "DELETE" }, "Failed to archive location");
      showToast("Location archived");
      await refreshData();
    } catch (err: unknown) {
      showToast(errorText(err, "Failed to archive location"));
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Office locations"
        description="Branches, floors and storage rooms where assets are kept."
        actions={
          canManage && (
            <Button size="sm" onClick={() => openForm("new")}>
              <Plus />
              Add location
            </Button>
          )
        }
      />

      {locations.length === 0 ? (
        <Card className="p-0">
          <NoData icon={<MapPin />} title="No locations yet" description="Add the offices and storage rooms where assets are kept." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => {
            const count = countFor(loc.id);
            return (
              <Card key={loc.id} className="gap-2 p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <MapPin className="size-4 shrink-0 text-primary" />
                  <span className="truncate">{loc.name}</span>
                </h3>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
                  <dt className="text-muted-foreground">Building</dt>
                  <dd className="truncate text-foreground">{loc.building || "—"}</dd>
                  <dt className="text-muted-foreground">Floor & room</dt>
                  <dd className="truncate text-foreground">{[loc.floor, loc.room].filter(Boolean).join(" · ") || "—"}</dd>
                  <dt className="text-muted-foreground">Branch</dt>
                  <dd className="truncate text-foreground">{loc.branch || "—"}</dd>
                </dl>
                <div className="flex items-center justify-between gap-2 border-t pt-2">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {count} asset{count === 1 ? "" : "s"} here
                  </span>
                  {canManage && (
                    <div className="-my-1 flex items-center gap-1">
                      <ActionButton icon={<Pencil />} label={`Edit ${loc.name}`} onClick={() => openForm(loc)} />
                      <ActionButton icon={<Trash2 />} label={`Archive ${loc.name}`} onClick={() => handleArchive(loc)} />
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
        title={editing === "new" ? "Add office location" : "Edit office location"}
        description="A room, studio or storage area where assets are kept."
        footer={
          <FormFooter
            formId="location-form"
            error={error}
            submitting={isSubmitting}
            disabled={!form.name.trim()}
            submitLabel={editing === "new" ? "Add location" : "Save changes"}
            onCancel={() => setEditing(null)}
          />
        }
      >
        <form id="location-form" onSubmit={handleSubmit} className="space-y-4">
          <Field label="Location name" htmlFor="loc-name" required>
            <Input id="loc-name" placeholder="e.g. HQ - Floor 3 (Creative Studio)" value={form.name} onChange={set("name")} className={CONTROL_HEIGHT} required />
          </Field>
          <FieldRow>
            <Field label="Building" htmlFor="loc-building">
              <Input id="loc-building" placeholder="HQ Tower" value={form.building} onChange={set("building")} className={CONTROL_HEIGHT} />
            </Field>
            <Field label="Floor" htmlFor="loc-floor">
              <Input id="loc-floor" placeholder="Floor 3" value={form.floor} onChange={set("floor")} className={CONTROL_HEIGHT} />
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="Room" htmlFor="loc-room">
              <Input id="loc-room" placeholder="Studio 301" value={form.room} onChange={set("room")} className={CONTROL_HEIGHT} />
            </Field>
            <Field label="Branch" htmlFor="loc-branch">
              <Input id="loc-branch" placeholder="Phnom Penh" value={form.branch} onChange={set("branch")} className={CONTROL_HEIGHT} />
            </Field>
          </FieldRow>
        </form>
      </ResponsiveModal>
    </div>
  );
}
