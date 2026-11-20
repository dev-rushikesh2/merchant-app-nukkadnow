import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthStateService } from '@nukkadnow/auth-client';
import { checkUserPermission } from './role-matrix';

export const merchantPermissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  const requiredPermission = route.data?.['permission'] as string | undefined;
  if (!requiredPermission) {
    return true;
  }

  const user = authState.user();
  const roles = user?.roles || [];

  const allowed = checkUserPermission(roles, requiredPermission);
  if (!allowed) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
