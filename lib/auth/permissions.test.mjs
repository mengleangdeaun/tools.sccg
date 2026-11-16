import assert from "node:assert/strict";
import { test } from "node:test";
import { ALL_PERMISSIONS, MAX_NAME_LENGTH, canGrant, checkDisplayName, effectivePermissions } from "./permissions.ts";

const member = (permissions, extra = {}) => ({ is_env_owner: false, role_id: "role-tech", permissions, ...extra });

test("owners hold every permission, members only their own", () => {
  assert.deepEqual(effectivePermissions(member([], { is_env_owner: true })), ALL_PERMISSIONS);
  assert.deepEqual(effectivePermissions(member([], { role_id: "owner" })), ALL_PERMISSIONS);
  assert.deepEqual(effectivePermissions(member(["assets.view"])), ["assets.view"]);
});

test("canGrant allows a subset and refuses anything extra", () => {
  const actor = member(["assets.view", "team.manage"]);
  assert.equal(canGrant(actor, ["assets.view"]), true);
  assert.equal(canGrant(actor, []), true);
  assert.equal(canGrant(actor, ["assets.view", "roles.manage"]), false);
  assert.equal(canGrant(member([], { is_env_owner: true }), ALL_PERMISSIONS), true);
});

test("checkDisplayName accepts real names and refuses empty, long or hidden-character ones", () => {
  assert.notEqual(checkDisplayName(""), null);
  assert.notEqual(checkDisplayName("   "), null);
  assert.notEqual(checkDisplayName(undefined), null);
  assert.equal(checkDisplayName("a".repeat(MAX_NAME_LENGTH)), null);
  assert.notEqual(checkDisplayName("a".repeat(MAX_NAME_LENGTH + 1)), null);
  assert.notEqual(checkDisplayName("Dara\nSok"), null);
  assert.equal(checkDisplayName("ដឿន ម៉េងលាង"), null);
});
