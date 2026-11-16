import { randomUUID } from "node:crypto";
import { getMembers } from "./auth/dal";
import { ALL_PERMISSIONS, MAX_NAME_LENGTH, Member, Permission, canGrant, checkDisplayName, normalizeEmail } from "./auth/permissions";
import { SheetError } from "./sheets/core";
import { appendRows, loadAll, patchRow } from "./sheets/table";

// Ported from content-planner's team-store, without channel scoping (this app has departments instead).

const newId = (prefix: string) => `${prefix}-${randomUUID().slice(0, 8)}`;
const text = (value: unknown) => (typeof value === "string" ? value.trim() : undefined);

interface StoredRole {
  id: string;
  name: string;
  permissions: Permission[];
  is_system: boolean;
}

async function getRoles(): Promise<StoredRole[]> {
  return (await loadAll()).Roles.rows
    .filter((r) => r.id && !r.archived_at)
    .map((r) => ({
      id: r.id,
      name: r.name,
      permissions: (r.permissions || "").split(",").filter(Boolean) as Permission[],
      is_system: r.is_system === "TRUE",
    }));
}

function assertCanAssignRole(actor: Member, role: StoredRole | undefined): asserts role is StoredRole {
  if (!role) throw new SheetError("That role does not exist.", 400);
  if (!canGrant(actor, role.permissions)) {
    throw new SheetError("You cannot assign a role with more access than your own.", 403);
  }
}

export async function addMember(
  actor: Member,
  input: { email?: string; name?: string; role_id?: string; department?: string }
): Promise<void> {
  const email = normalizeEmail(input.email ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new SheetError("Enter a valid email address.", 400);
  if ((await getMembers()).some((m) => m.email === email)) {
    throw new SheetError("That person is already on the team.", 409);
  }
  const role = (await getRoles()).find((r) => r.id === input.role_id);
  assertCanAssignRole(actor, role);

  await appendRows("Team_Members", [
    {
      id: newId("MEM"),
      email,
      name: text(input.name) ?? "",
      role_id: role.id,
      department: text(input.department) ?? "",
      status: "active",
      invited_by: actor.email,
    },
  ]);
}

export async function updateMember(
  actor: Member,
  input: { id?: string; name?: string; role_id?: string; department?: string; status?: string }
): Promise<void> {
  const target = (await getMembers()).find((m) => m.id === input.id);
  if (!target) throw new SheetError("That team member was not found.", 404);
  if (target.is_env_owner) {
    throw new SheetError("This Owner is set by ADMIN_EMAILS and can only be changed there.", 400);
  }
  if (target.email === normalizeEmail(actor.email)) {
    throw new SheetError("You cannot change your own role or status. Ask another admin.", 400);
  }
  if (input.status !== undefined && input.status !== "active" && input.status !== "inactive") {
    throw new SheetError("Status must be active or inactive.", 400);
  }

  const roles = await getRoles();
  const currentRole = roles.find((r) => r.id === target.role_id);
  if (currentRole && !canGrant(actor, currentRole.permissions)) {
    throw new SheetError("You cannot change someone with more access than your own.", 403);
  }
  if (input.role_id !== undefined) assertCanAssignRole(actor, roles.find((r) => r.id === input.role_id));

  await patchRow("Team_Members", target.id, {
    name: text(input.name),
    role_id: input.role_id,
    department: text(input.department),
    status: input.status,
  });
}

/**
 * Saves the sign-in time and Google photo. Google's name only fills an empty name, so a name
 * set in the app is never overwritten. ADMIN_EMAILS owners without a row get one, once.
 */
export async function recordLogin(member: Member, googleName?: string, picture?: string): Promise<void> {
  const now = new Date().toISOString();
  // Only Google's own photo host; anything else is dropped rather than rendered.
  const avatar = typeof picture === "string" && picture.startsWith("https://lh3.googleusercontent.com/") ? picture : undefined;
  const name = googleName?.trim().slice(0, MAX_NAME_LENGTH) || undefined;

  if (member.id.startsWith("env:")) {
    await appendRows("Team_Members", [
      {
        id: newId("MEM"),
        email: member.email,
        name: name ?? "",
        role_id: "owner",
        department: "",
        status: "active",
        invited_by: "ADMIN_EMAILS",
        last_login_at: now,
        avatar_url: avatar ?? "",
      },
    ]);
    return;
  }

  const row = (await loadAll()).Team_Members.rows.find((r) => r.id === member.id);
  await patchRow("Team_Members", member.id, {
    last_login_at: now,
    avatar_url: avatar,
    name: !row?.name?.trim() ? name : undefined,
  });
}

/** Anyone signed in may change their own name, and only their name. Admin rules do not apply to your own row. */
export async function updateOwnName(member: Member, input: unknown): Promise<void> {
  const problem = checkDisplayName(input);
  if (problem) throw new SheetError(problem, 400);
  const name = (input as string).trim();

  if (member.id.startsWith("env:")) {
    await appendRows("Team_Members", [
      { id: newId("MEM"), email: member.email, name, role_id: "owner", department: "", status: "active", invited_by: "ADMIN_EMAILS" },
    ]);
    return;
  }
  await patchRow("Team_Members", member.id, { name });
}

export async function saveRole(
  actor: Member,
  input: { id?: string; name?: string; permissions?: string[] }
): Promise<void> {
  const name = text(input.name);
  if (!name) throw new SheetError("Role name is required.", 400);

  const permissions = (input.permissions ?? []).filter((p): p is Permission =>
    (ALL_PERMISSIONS as string[]).includes(p)
  );
  if (!canGrant(actor, permissions)) throw new SheetError("You cannot grant permissions you do not have.", 403);

  const roles = await getRoles();
  if (roles.some((r) => r.name.toLowerCase() === name.toLowerCase() && r.id !== input.id)) {
    throw new SheetError("A role with that name already exists.", 409);
  }

  if (input.id) {
    const existing = roles.find((r) => r.id === input.id);
    if (!existing) throw new SheetError("That role was not found.", 404);
    if (!canGrant(actor, existing.permissions)) {
      throw new SheetError("You cannot change a role with more access than your own.", 403);
    }
    await patchRow("Roles", existing.id, { name, permissions: permissions.join(",") });
    return;
  }

  await appendRows("Roles", [
    { id: newId("role"), name, permissions: permissions.join(","), is_system: "FALSE", archived_at: "" },
  ]);
}

export async function archiveRole(actor: Member, id: string): Promise<void> {
  const role = (await getRoles()).find((r) => r.id === id);
  if (!role) throw new SheetError("That role was not found.", 404);
  if (role.is_system) throw new SheetError("Built-in roles cannot be deleted.", 400);
  if (!canGrant(actor, role.permissions)) {
    throw new SheetError("You cannot delete a role with more access than your own.", 403);
  }
  const holders = (await getMembers()).filter((m) => m.role_id === id).length;
  if (holders > 0) {
    throw new SheetError(`${holders} member${holders === 1 ? " has" : "s have"} this role. Move them to another role first.`, 409);
  }
  await patchRow("Roles", id, { archived_at: new Date().toISOString() });
}
