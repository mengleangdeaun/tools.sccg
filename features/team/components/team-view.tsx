"use client";

import React, { useState } from "react";
import { Lock, Pencil, UserPlus, Users } from "lucide-react";
import { useAssets } from "@/context/assets-context";
import { useAuth } from "@/context/auth-context";
import { useIsDesktop } from "@/hooks/use-media-query";
import { canGrant } from "@/lib/auth/permissions";
import { errorText } from "@/lib/request";
import { Person, Role } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { CONTROL_HEIGHT, Field, FieldRow, FormFooter } from "@/components/ui/form-layout";
import { PageHeader } from "@/components/shared/page-header";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { DataColumn, DataTable } from "@/components/shared/data-table";
import { CardList } from "@/components/shared/card-list";
import { ActionButton } from "@/components/shared/action-button";
import { EmptyState } from "@/components/shared/empty-state";
import { saveMember } from "../services/team-service";

const isActive = (p: Person) => p.status !== "inactive";

export function TeamView() {
  const { people, roles, assets, refreshData, showToast } = useAssets();
  const { currentUser, can } = useAuth();
  const isDesktop = useIsDesktop();
  const [editing, setEditing] = useState<Person | "new" | null>(null);

  const canManage = can("team.manage");
  const roleName = (roleId: string) => (roleId === "owner" ? "Owner" : roles.find((r) => r.id === roleId)?.name || "No role");
  const assignedCount = (p: Person) => assets.filter((a) => (a.custodian_email || "").toLowerCase() === p.email.toLowerCase()).length;
  // Server enforces the same rules; this only hides actions that would be refused.
  const isSelf = (p: Person) => p.email.toLowerCase() === currentUser?.email.toLowerCase();
  const canEdit = (p: Person) => {
    if (!canManage || !currentUser || isSelf(p)) return false;
    const role = roles.find((r) => r.id === p.role_id);
    return !role || canGrant(currentUser, role.permissions);
  };

  const member = (p: Person) => (
    <div className="flex min-w-0 items-center gap-2.5">
      <PersonAvatar name={p.name || p.email} avatarUrl={p.avatar_url} />
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">
          {p.name || p.email}
          {isSelf(p) && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>}
        </p>
        <p className="truncate text-xs text-muted-foreground">{p.email}</p>
      </div>
    </div>
  );
  const status = (p: Person) => (isActive(p) ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge>);
  const action = (p: Person, showLabel?: boolean) =>
    canEdit(p) ? (
      <ActionButton icon={<Pencil />} label={showLabel ? "Edit" : `Edit ${p.name || p.email}`} showLabel={showLabel} variant={showLabel ? "outline" : "ghost"} onClick={() => setEditing(p)} />
    ) : canManage ? (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title={isSelf(p) ? "You can't change your own access" : "More access than yours"}>
        <Lock className="size-3.5" aria-hidden />
        <span className="sr-only">{isSelf(p) ? "You can't change your own access" : "More access than yours"}</span>
      </span>
    ) : null;

  const empty = <EmptyState icon={<Users />} title="No team members yet" description="Add people by email. They can sign in with that Google account." />;

  const columns: DataColumn<Person>[] = [
    { key: "member", header: "Member", cell: member },
    { key: "department", header: "Department", className: "w-40", cell: (p) => <span className="text-muted-foreground">{p.department || "—"}</span> },
    { key: "role", header: "Role", className: "w-40", cell: (p) => roleName(p.role_id) },
    { key: "status", header: "Status", className: "w-28", cell: status },
    { key: "assets", header: "Assets held", className: "w-28", align: "right", cell: (p) => <span className="font-medium text-foreground">{assignedCount(p)}</span> },
    { key: "actions", header: <span className="sr-only">Actions</span>, className: "w-16", align: "right", interactive: true, cell: (p) => action(p) },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Team members"
        description="People who can sign in, and the role that decides what they can do."
        actions={
          canManage && (
            <Button size="sm" onClick={() => setEditing("new")}>
              <UserPlus />
              Add member
            </Button>
          )
        }
      />

      {isDesktop ? (
        <DataTable columns={columns} rows={people} getRowKey={(p) => p.id} empty={empty} />
      ) : (
        <CardList
          rows={people}
          getRowKey={(p) => p.id}
          empty={empty}
          renderCard={(p) => (
            <Card className="h-full gap-3 p-4">
              {member(p)}
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {status(p)}
                <span className="min-w-0 break-words">{roleName(p.role_id)}</span>
                {p.department && <span className="min-w-0 break-words">· {p.department}</span>}
                <span className="ml-auto tabular-nums">{assignedCount(p)} assets</span>
              </div>
              {canEdit(p) && <div>{action(p, true)}</div>}
            </Card>
          )}
        />
      )}

      {editing && currentUser && (
        <MemberDialog
          person={editing === "new" ? null : editing}
          roles={roles.filter((r) => canGrant(currentUser, r.permissions))}
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

function MemberDialog({
  person,
  roles,
  onClose,
  onSaved,
}: {
  person: Person | null;
  roles: Role[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState(person?.name ?? "");
  const [roleId, setRoleId] = useState(person?.role_id ?? roles.find((r) => r.name === "Viewer")?.id ?? roles[0]?.id ?? "");
  const [department, setDepartment] = useState(person?.department ?? "");
  const [active, setActive] = useState(person ? isActive(person) : true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await saveMember(
        person
          ? { id: person.id, name, role_id: roleId, department, status: active ? "active" : "inactive" }
          : { email, name, role_id: roleId, department }
      );
      onSaved(person ? "Member updated" : "Member added. They can sign in now.");
    } catch (err: unknown) {
      setError(errorText(err, "Failed to save team member"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ResponsiveModal
      open
      onOpenChange={(open: boolean) => !open && onClose()}
      title={person ? `Edit ${person.name || person.email}` : "Add team member"}
      description={person ? person.email : "They sign in with this Google account. The role decides what they can see and do."}
      footer={
        <FormFooter
          formId="member-form"
          error={error}
          submitting={saving}
          disabled={!roleId || (!person && !email.trim())}
          submitLabel={person ? "Save changes" : "Add member"}
          onCancel={onClose}
        />
      }
    >
      <form id="member-form" onSubmit={handleSubmit} className="space-y-4">
        {!person && (
          <Field label="Email" htmlFor="mem-email" required>
            <Input id="mem-email" type="email" autoComplete="off" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className={CONTROL_HEIGHT} required />
          </Field>
        )}
        <FieldRow>
          <Field label="Name" htmlFor="mem-name">
            <Input id="mem-name" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className={CONTROL_HEIGHT} />
          </Field>
          <Field label="Department" htmlFor="mem-dept">
            <Input id="mem-dept" placeholder="e.g. Creative, IT" value={department} onChange={(e) => setDepartment(e.target.value)} className={CONTROL_HEIGHT} />
          </Field>
        </FieldRow>
        <Field label="Role" required hint="Only roles within your own access">
          <ResponsiveSelect
            aria-label="Role"
            value={roleId}
            onValueChange={setRoleId}
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
            className={`${CONTROL_HEIGHT} w-full`}
          />
        </Field>
        {person && (
          <label className="flex items-center justify-between gap-3 rounded-md border p-3">
            <span className="space-y-0.5">
              <span className="block text-sm font-medium text-foreground">Active</span>
              <span className="block text-xs text-muted-foreground">Inactive members can't sign in. Their custody history is kept.</span>
            </span>
            <Switch checked={active} onCheckedChange={setActive} aria-label="Active" />
          </label>
        )}
      </form>
    </ResponsiveModal>
  );
}
