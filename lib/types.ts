export type AssetStatus =
  | "Available"
  | "Assigned"
  | "Maintenance"
  | "Reserved"
  | "Retired"
  | "Lost";

export type AssetCondition =
  | "Brand New"
  | "Good"
  | "Fair"
  | "Damaged";

export interface Asset {
  id: string;
  tag_code: string;
  name: string;
  category_id: string;
  brand: string;
  model: string;
  serial_number: string;
  status: AssetStatus;
  condition: AssetCondition;
  location_id: string;
  department: string;
  custodian_email: string;
  assigned_date: string;
  expected_return: string;
  purchase_date: string;
  purchase_price: string;
  supplier: string;
  warranty_expiry: string;
  notes: string;
  image_url: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  archived_at?: string;
}

export interface AssetCategory {
  id: string;
  name: string;
  prefix: string;
  icon: string;
  description: string;
  sort_order: number;
  archived_at?: string;
}

export interface AssetLocation {
  id: string;
  name: string;
  building: string;
  floor: string;
  room: string;
  branch: string;
  archived_at?: string;
}

export type ActivityKind =
  | "created"
  | "status"
  | "custody"
  | "maintenance"
  | "field"
  | "comment";

export interface AssetActivity {
  id: string;
  at: string;
  actor_email: string;
  kind: ActivityKind;
  entity: "asset";
  entity_id: string;
  from_value: string;
  to_value: string;
  body: string;
}

export type MaintenanceStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface AssetMaintenance {
  id: string;
  asset_id: string;
  service_type: string;
  vendor: string;
  cost: string;
  started_at: string;
  completed_at: string;
  status: MaintenanceStatus;
  notes: string;
  created_by: string;
}

export interface Person {
  id: string;
  email: string;
  name: string;
  role_id: string;
  department: string;
  status: "active" | "inactive";
  invited_by?: string;
  last_login_at?: string;
  avatar_url?: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  is_system?: boolean;
}

export type NavView =
  | "dashboard"
  | "inventory"
  | "checkout"
  | "maintenance"
  | "qr-studio"
  | "scanner"
  | "categories"
  | "locations"
  | "team"
  | "roles";

