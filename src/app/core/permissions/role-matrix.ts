export type MerchantPermission =
  | 'orders:view'
  | 'orders:accept'
  | 'orders:cancel'
  | 'orders:manage'
  | 'orders:status_prep_ready'
  | 'orders:refund_cancel'
  | 'catalog:view'
  | 'catalog:create_edit'
  | 'catalog:edit_price'
  | 'catalog:delete'
  | 'catalog:manage'
  | 'catalogue:edit_price'
  | 'inventory:view'
  | 'inventory:adjust_stock'
  | 'inventory:view_movements'
  | 'pos:walkin_billing'
  | 'capacity:manage'
  | 'delivery:manage'
  | 'profile:edit'
  | 'pricing:update'
  | 'analytics:view'
  | 'billing:view'
  | 'billing:manage'
  | 'billing:view_invoices'
  | 'staff:manage'
  | 'staff:invite_remove'
  | 'permissions:assign'
  | 'audit:view';

export const RolePermissions: Record<string, MerchantPermission[]> = {
  owner: [
    'orders:view', 'orders:accept', 'orders:cancel', 'orders:manage', 'orders:status_prep_ready', 'orders:refund_cancel',
    'catalog:view', 'catalog:create_edit', 'catalog:edit_price', 'catalog:delete', 'catalog:manage', 'catalogue:edit_price',
    'inventory:view', 'inventory:adjust_stock', 'inventory:view_movements',
    'pos:walkin_billing', 'pricing:update',
    'capacity:manage', 'delivery:manage', 'profile:edit',
    'analytics:view', 'billing:view', 'billing:manage', 'billing:view_invoices',
    'staff:manage', 'staff:invite_remove', 'permissions:assign', 'audit:view',
  ],
  merchant_owner: [
    'orders:view', 'orders:accept', 'orders:cancel', 'orders:manage', 'orders:status_prep_ready', 'orders:refund_cancel',
    'catalog:view', 'catalog:create_edit', 'catalog:edit_price', 'catalog:delete', 'catalog:manage', 'catalogue:edit_price',
    'inventory:view', 'inventory:adjust_stock', 'inventory:view_movements',
    'pos:walkin_billing', 'pricing:update',
    'capacity:manage', 'delivery:manage', 'profile:edit',
    'analytics:view', 'billing:view', 'billing:manage', 'billing:view_invoices',
    'staff:manage', 'staff:invite_remove', 'permissions:assign', 'audit:view',
  ],
  manager: [
    'orders:view', 'orders:accept', 'orders:cancel', 'orders:manage', 'orders:status_prep_ready', 'orders:refund_cancel',
    'catalog:view', 'catalog:create_edit', 'catalog:edit_price', 'catalog:manage', 'catalogue:edit_price',
    'inventory:view', 'inventory:adjust_stock', 'inventory:view_movements',
    'pos:walkin_billing', 'pricing:update',
    'capacity:manage', 'delivery:manage',
    'analytics:view',
  ],
  outlet_manager: [
    'orders:view', 'orders:accept', 'orders:cancel', 'orders:manage', 'orders:status_prep_ready', 'orders:refund_cancel',
    'catalog:view', 'catalog:create_edit', 'catalog:edit_price', 'catalog:manage', 'catalogue:edit_price',
    'inventory:view', 'inventory:adjust_stock', 'inventory:view_movements',
    'pos:walkin_billing', 'pricing:update',
  ],
  cashier: [
    'orders:view', 'orders:accept',
    'catalog:view',
    'inventory:view',
    'pos:walkin_billing',
  ],
  chef: [
    'orders:view', 'orders:accept', 'orders:status_prep_ready',
    'catalog:view',
    'inventory:view', 'inventory:adjust_stock',
  ],
  inventory: [
    'orders:view',
    'catalog:view',
    'inventory:view', 'inventory:adjust_stock', 'inventory:view_movements',
  ],
};

export function checkUserPermission(userRoles: string[] | undefined, requiredPermission: string): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  if (userRoles.some(r => r.toUpperCase() === 'PLATFORM_ADMIN' || r.toUpperCase() === 'SUPER_ADMIN')) {
    return true;
  }
  for (const r of userRoles) {
    const normalized = r.toLowerCase();
    const perms = RolePermissions[normalized] || [];
    if (perms.includes(requiredPermission as any)) {
      return true;
    }
  }
  return false;
}
