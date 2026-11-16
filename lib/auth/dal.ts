import { cookies } from "next/headers";
import { SheetError } from "../sheets/core";
import { loadAll } from "../sheets/table";
import {
  Member,
  OWNER_ROLE_ID,
  Permission,
  hasPermission,
  normalizeEmail,
} from "./permissions";
import { SESSION_COOKIE, readSessionToken } from "./session";

export async function getMembers(): Promise<Member[]> {
  try {
    const tabs = await loadAll();
    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map(normalizeEmail)
      .filter(Boolean);

    const rolesMap = new Map<string, { name: string; permissions: Permission[] }>();
    // An archived role grants nothing.
    tabs.Roles.rows.filter((r) => !r.archived_at).forEach((r) => {
      rolesMap.set(r.id, {
        name: r.name,
        permissions: (r.permissions || "").split(",").filter(Boolean) as Permission[],
      });
    });

    return tabs.Team_Members.rows.map((r) => {
      const email = normalizeEmail(r.email);
      const isEnvOwner = adminEmails.includes(email);
      const role = rolesMap.get(r.role_id) || {
        name: isEnvOwner ? "Owner" : "Member",
        permissions: [],
      };

      return {
        id: r.id,
        email,
        name: r.name || email.split("@")[0],
        role_id: isEnvOwner ? OWNER_ROLE_ID : r.role_id,
        role_name: isEnvOwner ? "Owner" : role.name,
        department: r.department || "",
        status: (r.status as "active" | "inactive") || "active",
        permissions: role.permissions,
        is_env_owner: isEnvOwner,
        last_login_at: r.last_login_at || "",
        avatar_url: r.avatar_url || "",
      };
    });
  } catch {
    return [];
  }
}

export async function findActiveMember(email: string): Promise<Member | null> {
  const target = normalizeEmail(email);
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean);

  const member = (await getMembers()).find((m) => m.email === target);

  if (adminEmails.includes(target)) {
    // ADMIN_EMAILS owners are always active. Their sheet row (if any) supplies id, name and photo.
    if (member) return { ...member, status: "active" };
    return {
      id: `env:${target}`,
      email: target,
      name: target.split("@")[0],
      role_id: OWNER_ROLE_ID,
      role_name: "Owner",
      department: "",
      status: "active",
      permissions: [],
      is_env_owner: true,
      last_login_at: "",
      avatar_url: "",
    };
  }

  return member?.status === "active" ? member : null;
}

export async function getCurrentMember(): Promise<Member> {
  const cookieStore = await cookies();
  const email = await readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!email) throw new SheetError("Please sign in.", 401);

  const member = await findActiveMember(email);
  if (!member) throw new SheetError("Your access has been removed.", 401);
  return member;
}

export function assertPermission(member: Member, permission: Permission) {
  if (!hasPermission(member, permission)) {
    throw new SheetError("You do not have permission to do this.", 403);
  }
}

export async function requirePermission(permission: Permission): Promise<Member> {
  const member = await getCurrentMember();
  assertPermission(member, permission);
  return member;
}

