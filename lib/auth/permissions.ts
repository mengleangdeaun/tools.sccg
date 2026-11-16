export const PERMISSION_GROUPS = [
  {
    label: "Assets",
    permissions: [
      { key: "assets.view", label: "View assets" },
      { key: "assets.create", label: "Create assets" },
      { key: "assets.edit", label: "Edit asset details" },
      { key: "assets.delete", label: "Archive / delete assets" },
    ],
  },
  {
    label: "Operations",
    permissions: [
      { key: "assets.custody", label: "Check-in, check-out & transfer custody" },
      { key: "assets.maintenance", label: "Log maintenance and repairs" },
      { key: "assets.print", label: "Print single & batch QR code labels" },
    ],
  },
  {
    label: "Configuration",
    permissions: [
      { key: "categories.manage", label: "Manage asset categories" },
      { key: "locations.manage", label: "Manage office locations" },
    ],
  },
  {
    label: "Administration",
    permissions: [
      { key: "team.manage", label: "Manage team members" },
      { key: "roles.manage", label: "Manage roles & permissions" },
      { key: "system.manage", label: "Manage database & sheet structure" },
    ],
  },
] as const;

export type Permission = (typeof PERMISSION_GROUPS)[number]["permissions"][number]["key"];

export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((group) =>
  group.permissions.map((p) => p.key)
) as Permission[];

export const OWNER_ROLE_ID = "owner";

export interface Member {
  id: string;
  email: string;
  name: string;
  role_id: string;
  role_name: string;
  department: string;
  status: "active" | "inactive";
  permissions: Permission[];
  is_env_owner: boolean;
  last_login_at: string;
  avatar_url: string;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hasPermission(member: Member | null | undefined, permission: Permission): boolean {
  if (!member || member.status !== "active") return false;
  if (member.is_env_owner || member.role_id === OWNER_ROLE_ID) return true;
  return member.permissions.includes(permission);
}


/** Owners hold every permission even though their stored list is empty. */
export function effectivePermissions(member: Pick<Member, "is_env_owner" | "role_id" | "permissions">): Permission[] {
  if (member.is_env_owner || member.role_id === OWNER_ROLE_ID) return ALL_PERMISSIONS;
  return member.permissions;
}

// Nobody can hand out access they do not hold themselves.
export function canGrant(actor: Pick<Member, "is_env_owner" | "role_id" | "permissions">, permissions: readonly string[]): boolean {
  const held = effectivePermissions(actor) as string[];
  return permissions.every((p) => held.includes(p));
}

export const MAX_NAME_LENGTH = 80;

/** Returns what is wrong with a display name, or null. */
export function checkDisplayName(name: unknown): string | null {
  if (typeof name !== "string" || !name.trim()) return "Enter your name.";
  if (name.trim().length > MAX_NAME_LENGTH) return `Names can be up to ${MAX_NAME_LENGTH} characters.`;
  if (/[\u0000-\u001f\u007f]/.test(name)) return "Names cannot contain line breaks or hidden characters.";
  return null;
}
