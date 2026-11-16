"use client";

import React, { useState } from "react";
import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useAssets } from "@/context/assets-context";
import { useAuth } from "@/context/auth-context";
import { PERMISSION_GROUPS, canGrant, effectivePermissions } from "@/lib/auth/permissions";
import { errorText } from "@/lib/request";
import { Role } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { CONTROL_HEIGHT, Field, FormFooter } from "@/components/ui/form-layout";
import { PageHeader } from "@/components/shared/page-header";
import { ActionButton } from "@/components/shared/action-button";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { deleteRole, saveRole } from "../services/team-service";

const LABELS = new Map<string, string>(PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => [p.key, p.label] as const)));

export function RolesView() {
  const { roles, people, refreshData, showToast } = useAssets();
  const { currentUser, can } = useAuth();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<Role | "new" | null>(null);

  const canManage = can("roles.manage");
  // Server enforces the same rule; this only hides actions it would refuse.
  const canChange = (role: Role) => canManage && !!currentUser && canGrant(currentUser, role.permissions);
  const holders = (role: Role) => people.filter((p) => p.role_id === role.id).length;

  const handleDelete = async (role: Role) => {
    const count = holders(role);
    if (count > 0) {
      showToast(`${count} member${count === 1 ? " has" : "s have"} "${role.name}". Move them to another role first.`);
      return;
    }
    const ok = await confirm({
      title: `Delete "${role.name}"?`,
      description: "Nobody has this role, so no one loses access. The row stays in the sheet as archived.",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await deleteRole(role.id);
      showToast("Role deleted");
      await refreshData();
    } catch (err: unknown) {
      showToast(errorText(err, "Failed to delete role"));
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Roles & permissions"
        description="Access levels and what each role is allowed to do."
        actions={
          canManage && (
            <Button size="sm" onClick={() => setEditing("new")}>
              <Plus />
              New role
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {roles.map((role) => {
          const count = holders(role);
          return (
            <Card key={role.id} className="gap-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
                  <ShieldCheck className="size-4 shrink-0 text-primary" />
                  <span className="truncate">{role.name}</span>
                  {role.is_system && <Badge variant="secondary">Built-in</Badge>}
                </h3>
                {canChange(role) && (
                  <div className="-my-1 flex shrink-0 items-center gap-1">
                    <ActionButton icon={<Pencil />} label={`Edit ${role.name}`} onClick={() => setEditing(role)} />
                    {!role.is_system && <ActionButton icon={<Trash2 />} label={`Delete ${role.name}`} onClick={() => handleDelete(role)} />}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground tabular-nums">
                {count} member{count === 1 ? "" : "s"} · {role.permissions.length} permission{role.permissions.length === 1 ? "" : "s"}
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {role.permissions.map((p) => (
                  <li key={p} className="rounded border bg-muted/60 px-1.5 py-0.5 text-xs text-muted-foreground">
                    {LABELS.get(p) ?? p}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      {editing && currentUser && (
        <RoleDialog
          role={editing === "new" ? null : editing}
          held={effectivePermissions(currentUser)}
          onClose={() => setEditing(null)}
          onSaved={async (message) => {
            setEditing(null);
            showToast(message);
            await refreshData();
          }}
        />
      )}
    </div>
  );
}

function RoleDialog({
  role,
  held,
  onClose,
  onSaved,
}: {
  role: Role | null;
  held: readonly string[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [name, setName] = useState(role?.name ?? "");
  const [permissions, setPermissions] = useState<string[]>(role?.permissions ?? ["assets.view"]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggle = (key: string, checked: boolean) =>
    setPermissions((prev) => (checked ? [...prev, key] : prev.filter((p) => p !== key)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await saveRole({ id: role?.id, name, permissions });
      onSaved(role ? "Role updated" : "Role created");
    } catch (err: unknown) {
      setError(errorText(err, "Failed to save role"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ResponsiveModal
      open
      onOpenChange={(open: boolean) => !open && onClose()}
      title={role ? `Edit ${role.name}` : "New role"}
      description="Changes apply to everyone with this role on their next request."
      size="lg"
      footer={
        <FormFooter
          formId="role-form"
          error={error}
          submitting={saving}
          disabled={!name.trim()}
          submitLabel={role ? "Save changes" : "Create role"}
          onCancel={onClose}
        />
      }
    >
      <form id="role-form" onSubmit={handleSubmit} className="space-y-5">
        <Field label="Role name" htmlFor="role-name" required>
          <Input id="role-name" placeholder="e.g. Front desk" value={name} onChange={(e) => setName(e.target.value)} className={CONTROL_HEIGHT} required />
        </Field>

        {PERMISSION_GROUPS.map((group) => (
          <fieldset key={group.label} className="space-y-2">
            <legend className="text-sm font-semibold text-foreground">{group.label}</legend>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {group.permissions.map((p) => {
                const allowed = held.includes(p.key);
                return (
                  <label
                    key={p.key}
                    className={`flex min-h-11 items-center gap-2.5 rounded-md px-2 py-1.5 text-sm md:min-h-9 ${allowed ? "cursor-pointer hover:bg-muted/50" : "cursor-not-allowed opacity-60"}`}
                    title={allowed ? undefined : "You don't have this permission, so you can't grant it."}
                  >
                    <Checkbox checked={permissions.includes(p.key)} disabled={!allowed} onCheckedChange={(checked) => toggle(p.key, checked)} />
                    <span className="text-foreground">{p.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}

      </form>
    </ResponsiveModal>
  );
}
