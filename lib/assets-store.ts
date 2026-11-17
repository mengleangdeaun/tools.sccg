import { randomUUID } from "node:crypto";
import {
  Asset,
  AssetActivity,
  AssetCategory,
  AssetLocation,
  AssetMaintenance,
  AssetSupplier,
  Person,
  Role,
} from "./types";
import { Fields, Row, SheetError } from "./sheets/core";
import { appendRows, loadAll, patchRow, updateWhere } from "./sheets/table";
import { normalizeSerials } from "./serials";

const newId = (prefix: string) => `${prefix}-${randomUUID().slice(0, 8)}`;
const now = () => new Date().toISOString();

export async function getAllAssetData() {
  const tabs = await loadAll();

  const assets: Asset[] = tabs.Assets.rows
    .filter((r) => r.id && !r.archived_at)
    .map((r) => r as unknown as Asset);

  const categories: AssetCategory[] = tabs.Asset_Categories.rows
    .filter((r) => r.id && !r.archived_at)
    .map((r) => ({
      ...r,
      sort_order: Number(r.sort_order) || 0,
    })) as AssetCategory[];

  const locations: AssetLocation[] = tabs.Asset_Locations.rows
    .filter((r) => r.id && !r.archived_at)
    .map((r) => r as unknown as AssetLocation);

  const suppliers: AssetSupplier[] = tabs.Asset_Suppliers.rows
    .filter((r) => r.id && !r.archived_at)
    .map((r) => r as unknown as AssetSupplier);

  const maintenance: AssetMaintenance[] = tabs.Asset_Maintenance.rows
    .filter((r) => r.id)
    .map((r) => r as unknown as AssetMaintenance);

  const people: Person[] = tabs.Team_Members.rows
    .filter((r) => r.id)
    .map((r) => r as unknown as Person);

  const roles: Role[] = tabs.Roles.rows
    .filter((r) => r.id && !r.archived_at)
    .map((r) => ({
      id: r.id,
      name: r.name,
      permissions: (r.permissions || "").split(",").filter(Boolean),
      is_system: r.is_system === "TRUE",
    }));

  return {
    assets,
    categories,
    locations,
    suppliers,
    maintenance,
    people,
    roles,
  };
}

export async function saveAsset(
  partial: Partial<Asset>,
  actorEmail: string
): Promise<Asset> {
  const tabs = await loadAll();
  const existing = partial.id ? tabs.Assets.rows.find((r) => r.id === partial.id) : undefined;
  if (partial.id && !existing) throw new SheetError("That asset was not found.", 404);
  // Edits may send only the changed fields (e.g. a status change); keep the rest as stored.
  const input = { ...(existing as Partial<Asset> | undefined), ...partial };
  const fields = assetFields(input);

  if (input.id) {
    const updated = (await patchRow("Assets", input.id, fields)) as unknown as Asset;

    // Track status change or critical field changes in activity timeline
    if (existing && existing.status !== fields.status) {
      await logAssetActivity(actorEmail, [
        {
          kind: "status",
          entity_id: input.id,
          from_value: existing.status,
          to_value: String(fields.status),
          body: "Status changed",
        },
      ]);
    }
    return updated;
  }

  const [created] = await createAssets(tabs, fields, 1, [String(fields.serial_number)], actorEmail);
  return created;
}

// Registers `quantity` identical assets in one sheet write; each gets its own tag and (optional) serial.
export async function registerAssets(
  partial: Partial<Asset>,
  quantity: number,
  serials: string[],
  actorEmail: string
): Promise<Asset[]> {
  return createAssets(await loadAll(), assetFields(partial), quantity, serials, actorEmail);
}

function assetFields(input: Partial<Asset>): Fields {
  const name = input.name?.trim();
  if (!name) throw new SheetError("Asset name is required.", 400);
  return {
    name,
    tag_code: input.tag_code?.trim() || "",
    category_id: input.category_id || "",
    brand: input.brand?.trim() || "",
    model: input.model?.trim() || "",
    serial_number: input.serial_number?.trim() || "",
    status: input.status || "Available",
    condition: input.condition || "Good",
    location_id: input.location_id || "",
    department: input.department?.trim() || "",
    custodian_email: input.custodian_email?.trim() || "",
    assigned_date: input.assigned_date || "",
    expected_return: input.expected_return || "",
    purchase_date: input.purchase_date || "",
    purchase_price: input.purchase_price || "",
    supplier: input.supplier?.trim() || "",
    warranty_expiry: input.warranty_expiry || "",
    notes: input.notes?.trim() || "",
    image_url: input.image_url?.trim() || "",
    invoice_no: input.invoice_no?.trim() || "",
    supplier_id: input.supplier_id || "",
  };
}

async function createAssets(
  tabs: Awaited<ReturnType<typeof loadAll>>,
  base: Fields,
  quantity: number,
  serialInput: string[],
  actorEmail: string
): Promise<Asset[]> {
  const { serials, error } = normalizeSerials(serialInput, quantity);
  if (error) throw new SheetError(error, 400);

  const used = new Set(
    tabs.Assets.rows.filter((r) => r.id && !r.archived_at).map((r) => r.serial_number?.trim().toLowerCase()).filter(Boolean)
  );
  const clashes = serials.filter((s) => used.has(s.toLowerCase()));
  if (clashes.length > 0) throw new SheetError(`Serial number already registered: ${clashes.join(", ")}.`, 400);

  const customTag = String(base.tag_code || "").trim();
  if (customTag && quantity > 1) throw new SheetError("Leave the tag code blank when registering more than one asset.", 400);

  // Tag code: <prefix>-YYMMDD-NN, sequential per day, retried until unused.
  const rawPrefix = tabs.Asset_Categories.rows.find((c) => c.id === base.category_id)?.prefix || "AST-";
  const basePrefix = String(rawPrefix).replace(/-+$/, "");
  const d = new Date();
  const datePart = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const tagPrefix = `${basePrefix}-${datePart}-`;
  const taken = new Set(tabs.Assets.rows.map((r) => r.tag_code));
  const nextTag = () => {
    let seq = 1;
    for (const t of taken) {
      if (t && t.startsWith(tagPrefix)) {
        const n = parseInt(t.slice(tagPrefix.length), 10);
        if (!Number.isNaN(n) && n >= seq) seq = n + 1;
      }
    }
    let tag = `${tagPrefix}${String(seq).padStart(2, "0")}`;
    while (taken.has(tag)) {
      seq += 1;
      tag = `${tagPrefix}${String(seq).padStart(2, "0")}`;
    }
    taken.add(tag);
    return tag;
  };

  const timestamp = now();
  const records = Array.from({ length: quantity }, (_, i) => ({
    ...base,
    id: newId("AST"),
    tag_code: customTag || nextTag(),
    serial_number: serials[i] || "",
    created_by: actorEmail,
    created_at: timestamp,
    updated_at: timestamp,
    archived_at: "",
  }));

  await appendRows("Assets", records);
  await logAssetActivity(
    actorEmail,
    records.map((r) => ({
      kind: "created" as const,
      entity_id: r.id,
      to_value: String(base.status),
      body: `Asset created with tag ${r.tag_code}`,
    }))
  );

  return records as unknown as Asset[];
}

export async function checkoutAsset(
  assetId: string,
  input: {
    custodian_email: string;
    department?: string;
    expected_return?: string;
    notes?: string;
  },
  actorEmail: string
): Promise<Asset> {
  const existing = (await loadAll()).Assets.rows.find((r) => r.id === assetId);
  if (!existing) throw new SheetError("Asset not found.", 404);

  const prevCustodian = existing.custodian_email || "Unassigned";
  const timestamp = now().slice(0, 10);

  const updated = (await patchRow("Assets", assetId, {
    status: "Assigned",
    custodian_email: input.custodian_email,
    department: input.department ?? existing.department,
    assigned_date: timestamp,
    expected_return: input.expected_return ?? "",
  })) as unknown as Asset;

  await logAssetActivity(actorEmail, [
    {
      kind: "custody",
      entity_id: assetId,
      from_value: prevCustodian,
      to_value: input.custodian_email,
      body: input.notes ? `Checked out: ${input.notes}` : "Asset checked out to employee",
    },
    {
      kind: "status",
      entity_id: assetId,
      from_value: existing.status,
      to_value: "Assigned",
      body: "Status updated to Assigned",
    },
  ]);

  return updated;
}

export async function checkinAsset(
  assetId: string,
  input: {
    condition: string;
    location_id?: string;
    notes?: string;
  },
  actorEmail: string
): Promise<Asset> {
  const existing = (await loadAll()).Assets.rows.find((r) => r.id === assetId);
  if (!existing) throw new SheetError("Asset not found.", 404);

  const prevCustodian = existing.custodian_email || "Employee";

  const updated = (await patchRow("Assets", assetId, {
    status: "Available",
    custodian_email: "",
    condition: input.condition || existing.condition,
    location_id: input.location_id || existing.location_id,
    assigned_date: "",
    expected_return: "",
  })) as unknown as Asset;

  await logAssetActivity(actorEmail, [
    {
      kind: "custody",
      entity_id: assetId,
      from_value: prevCustodian,
      to_value: "In Inventory (Available)",
      body: input.notes ? `Checked in: ${input.notes}` : "Asset returned to stock",
    },
    {
      kind: "status",
      entity_id: assetId,
      from_value: existing.status,
      to_value: "Available",
      body: `Status updated to Available (Condition: ${input.condition})`,
    },
  ]);

  return updated;
}

export async function logAssetMaintenance(
  input: Partial<AssetMaintenance>,
  actorEmail: string
): Promise<AssetMaintenance> {
  if (!input.asset_id) throw new SheetError("Asset ID is required.", 400);

  const timestamp = now();
  const id = newId("MNT");
  const record = {
    id,
    asset_id: input.asset_id,
    service_type: input.service_type || "Repair",
    vendor: input.vendor || "",
    cost: input.cost || "0",
    started_at: input.started_at || timestamp.slice(0, 10),
    completed_at: input.completed_at || "",
    status: input.status || "in_progress",
    notes: input.notes || "",
    created_by: actorEmail,
  };

  await appendRows("Asset_Maintenance", [record]);

  if (record.status === "in_progress") {
    await patchRow("Assets", input.asset_id, { status: "Maintenance" });
  }

  await logAssetActivity(actorEmail, [
    {
      kind: "maintenance",
      entity_id: input.asset_id,
      from_value: "",
      to_value: record.service_type,
      body: `${record.service_type} logged with ${record.vendor || "vendor"} ($${record.cost})`,
    },
  ]);

  return record as unknown as AssetMaintenance;
}

export async function getAssetActivity(assetId: string): Promise<AssetActivity[]> {
  const tabs = await loadAll();
  return tabs.Asset_Activity.rows
    .filter((row) => row.id && row.entity === "asset" && row.entity_id === assetId)
    .map((row) => row as unknown as AssetActivity)
    .sort((a, b) => b.at.localeCompare(a.at));
}

export type ActivityEvent = Pick<AssetActivity, "kind" | "entity_id"> &
  Partial<Pick<AssetActivity, "from_value" | "to_value" | "body">>;

export async function logAssetActivity(
  actorEmail: string,
  events: ActivityEvent[]
): Promise<void> {
  if (events.length === 0) return;
  const at = now();
  await appendRows(
    "Asset_Activity",
    events.map((event) => ({
      id: newId("ACT"),
      at,
      actor_email: actorEmail,
      entity: "asset",
      from_value: "",
      to_value: "",
      body: "",
      ...event,
    }))
  );
}

export async function addAssetComment(
  assetId: string,
  body: string,
  actorEmail: string
): Promise<void> {
  const text = body?.trim();
  if (!text) throw new SheetError("Comment cannot be empty.", 400);
  await logAssetActivity(actorEmail, [
    {
      kind: "comment",
      entity_id: assetId,
      body: text,
    },
  ]);
}

