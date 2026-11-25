// Canonical permission model for NukkadNow Merchant Portal
// Role names are owner-defined custom strings; presets below are optional convenience templates only.

export type MerchantStaffRole = string;

export type MerchantPermission =
  // Orders
  | 'orders:view'
  | 'orders:accept'
  | 'orders:status_prep_ready'
  | 'orders:refund_cancel'
  | 'orders:manage'
  // Catalog
  | 'catalog:view'
  | 'catalog:create_edit'
  | 'catalog:delete'
  | 'catalog:edit_price'
  // Alias kept for backward compat
  | 'catalogue:edit_price'
  // Inventory
  | 'inventory:view'
  | 'inventory:adjust_stock'
  | 'inventory:view_movements'
  // POS / Walk-in
  | 'pos:walkin_billing'
  // Settings
  | 'capacity:manage'
  | 'delivery:manage'
  | 'profile:edit'
  // Finance
  | 'analytics:view'
  | 'billing:manage'
  | 'billing:view_invoices'
  // Staff & Permissions (Owner-locked)
  | 'staff:manage'
  | 'staff:invite_remove'
  | 'permissions:assign'
  // Audit (Owner-locked)
  | 'audit:view';

/** Optional permission templates/defaults when no custom permissions array is provided. */
export const ROLE_PERMISSIONS: Record<string, MerchantPermission[]> = {
  OWNER: [
    'orders:view', 'orders:accept', 'orders:status_prep_ready', 'orders:refund_cancel', 'orders:manage',
    'catalog:view', 'catalog:create_edit', 'catalog:delete', 'catalog:edit_price', 'catalogue:edit_price',
    'inventory:view', 'inventory:adjust_stock', 'inventory:view_movements',
    'pos:walkin_billing',
    'capacity:manage', 'delivery:manage', 'profile:edit',
    'analytics:view', 'billing:manage', 'billing:view_invoices',
    'staff:manage', 'staff:invite_remove', 'permissions:assign',
    'audit:view',
  ],
  MANAGER: [
    'orders:view', 'orders:accept', 'orders:status_prep_ready', 'orders:refund_cancel', 'orders:manage',
    'catalog:view', 'catalog:create_edit', 'catalog:edit_price', 'catalogue:edit_price',
    'inventory:view', 'inventory:adjust_stock', 'inventory:view_movements',
    'pos:walkin_billing',
    'capacity:manage', 'delivery:manage',
    'analytics:view',
  ],
  OUTLET_MANAGER: [
    'orders:view', 'orders:accept', 'orders:status_prep_ready', 'orders:refund_cancel', 'orders:manage',
    'catalog:view', 'catalog:create_edit', 'catalog:edit_price', 'catalogue:edit_price',
    'inventory:view', 'inventory:adjust_stock', 'inventory:view_movements',
    'pos:walkin_billing',
    'capacity:manage',
    'analytics:view',
  ],
  CASHIER: [
    'orders:view', 'orders:accept',
    'catalog:view',
    'inventory:view',
    'pos:walkin_billing',
  ],
  CHEF: [
    'orders:view', 'orders:accept', 'orders:status_prep_ready',
    'catalog:view',
    'inventory:view', 'inventory:adjust_stock',
  ],
  INVENTORY: [
    'orders:view',
    'catalog:view',
    'inventory:view', 'inventory:adjust_stock', 'inventory:view_movements',
  ],
};

/** Permissions that are ALWAYS Owner-only — no staff can be granted these, even if manually set. */
export const OWNER_LOCKED_PERMISSIONS: MerchantPermission[] = [
  'staff:manage', 'staff:invite_remove', 'permissions:assign', 'audit:view',
  'billing:manage', 'billing:view_invoices', 'profile:edit', 'delivery:manage',
];

/** Human-readable label for every permission, used in the invite modal checkbox grid. */
export const PERMISSION_LABELS: Record<MerchantPermission, string> = {
  'orders:view': 'View Orders',
  'orders:accept': 'Accept / Reject Orders',
  'orders:status_prep_ready': 'Mark Prep / Ready',
  'orders:refund_cancel': 'Refund & Cancel Orders',
  'orders:manage': 'Full Order Management',
  'catalog:view': 'View Products & Catalog',
  'catalog:create_edit': 'Add / Edit Products',
  'catalog:delete': 'Delete Products',
  'catalog:edit_price': 'Edit Prices',
  'catalogue:edit_price': 'Edit Prices (legacy)',
  'inventory:view': 'View Stock Balances',
  'inventory:adjust_stock': 'Adjust Stock Quantities',
  'inventory:view_movements': 'View Stock Movement History',
  'pos:walkin_billing': 'Walk-in POS Billing',
  'capacity:manage': 'Manage Capacity & Slots',
  'delivery:manage': 'Manage Delivery Settings',
  'profile:edit': 'Edit Shop Profile',
  'analytics:view': 'View Analytics & Reports',
  'billing:manage': 'Manage Billing & Subscriptions',
  'billing:view_invoices': 'View Invoices',
  'staff:manage': 'Manage Staff Members',
  'staff:invite_remove': 'Invite / Remove Staff',
  'permissions:assign': 'Assign Staff Permissions',
  'audit:view': 'View Activity & Audit Logs',
};

/** Permission groups for the UI checkbox grid in invite modal. */
export const PERMISSION_GROUPS: { label: string; perms: MerchantPermission[] }[] = [
  {
    label: 'Orders',
    perms: ['orders:view', 'orders:accept', 'orders:status_prep_ready', 'orders:refund_cancel'],
  },
  {
    label: 'Catalog & Products',
    perms: ['catalog:view', 'catalog:create_edit', 'catalog:edit_price', 'catalog:delete'],
  },
  {
    label: 'Inventory & Stock',
    perms: ['inventory:view', 'inventory:adjust_stock', 'inventory:view_movements'],
  },
  {
    label: 'POS & Billing',
    perms: ['pos:walkin_billing'],
  },
  {
    label: 'Store Settings',
    perms: ['capacity:manage'],
  },
];
