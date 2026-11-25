import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthStateService } from '@nukkadnow/auth-client';
import { StaffPermissionStore } from './staff-permission.store';
import { checkUserPermission } from './role-matrix';

/**
 * merchantPermissionGuard
 *
 * Checks permissions in this order:
 * 1. If a staff member has taken control of the terminal (StaffPermissionStore.activeTerminalStaff),
 *    their custom permissions[] array is authoritative.
 * 2. Otherwise, fall back to the JWT-role-based RolePermissions matrix.
 *
 * Owner always bypasses: when no staff is active, StaffPermissionStore.hasPermission() returns true.
 */
export const merchantPermissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authState = inject(AuthStateService);
  const permStore = inject(StaffPermissionStore);
  const router = inject(Router);

  const requiredPermission = route.data?.['permission'] as string | undefined;
  if (!requiredPermission) return true;

  // Staff mode: use custom permission array from StaffPermissionStore
  if (permStore.isStaffMode()) {
    const allowed = permStore.hasPermission(requiredPermission);
    if (!allowed) {
      router.navigate(['/dashboard'], { queryParams: { denied: requiredPermission } });
      return false;
    }
    return true;
  }

  // Owner mode: fall back to JWT role check
  const user = authState.user();
  const roles = user?.roles || [];
  const allowed = checkUserPermission(roles, requiredPermission);
  if (!allowed) {
    router.navigate(['/dashboard'], { queryParams: { denied: requiredPermission } });
    return false;
  }
  return true;
};
