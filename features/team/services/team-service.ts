import { request } from "@/lib/request";

export interface MemberInput {
  id?: string;
  email?: string;
  name?: string;
  role_id?: string;
  department?: string;
  status?: "active" | "inactive";
}

export function saveMember(input: MemberInput) {
  return request("/api/team", { method: input.id ? "PUT" : "POST", body: JSON.stringify(input) }, "Failed to save team member");
}

export function saveRole(input: { id?: string; name: string; permissions: string[] }) {
  return request("/api/roles", { method: "POST", body: JSON.stringify(input) }, "Failed to save role");
}

export function deleteRole(id: string) {
  return request(`/api/roles?id=${encodeURIComponent(id)}`, { method: "DELETE" }, "Failed to delete role");
}
