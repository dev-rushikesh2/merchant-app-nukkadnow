import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TenantStore } from '../tenant-context/tenant.store';
import { OutletSwitcherStore } from '../outlet-context/outlet-switcher.store';
import { TokenStorageService } from '@nukkadnow/auth-client';
import { StaffPermissionStore } from '../permissions/staff-permission.store';

export const tenantHeaderInterceptor: HttpInterceptorFn = (req, next) => {
  const tenantStore = inject(TenantStore);
  const outletStore = inject(OutletSwitcherStore);
  const tokenStorage = inject(TokenStorageService);
  const permStore = inject(StaffPermissionStore);

  const tenantId = tenantStore.activeTenantId();
  const outletId = outletStore.activeOutletId();
  const token = tokenStorage.getAccessToken();
  const shiftToken = permStore.shiftToken();

  let headers = req.headers;
  if (tenantId) headers = headers.set('x-tenant-id', tenantId);
  if (outletId) headers = headers.set('x-outlet-id', outletId);
  if (token && !headers.has('Authorization')) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }
  if (shiftToken) {
    headers = headers.set('x-staff-shift-token', shiftToken);
  }

  return next(req.clone({ headers }));
};
