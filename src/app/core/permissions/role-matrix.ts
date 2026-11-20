export type MerchantPermission =
  | 'orders:view'
  | 'orders:accept'
  | 'orders:cancel'
  | 'catalog:manage'
  | 'pricing:update'
  | 'billing:view'
  | 'staff:manage';

export const RolePermissions: Record<string, MerchantPermission[]> = {
  merchant_owner: ['orders:view', 'orders:accept', 'orders:cancel', 'catalog:manage', 'pricing:update', 'billing:view', 'staff:manage'],
  outlet_manager: ['orders:view', 'orders:accept', 'orders:cancel', 'catalog:manage', 'pricing:update'],
  cashier: ['orders:view', 'orders:accept']
};

export function checkUserPermission(userRoles: string[] | undefined, requiredPermission: string): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  // Super admin / platform admin has all permissions
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
