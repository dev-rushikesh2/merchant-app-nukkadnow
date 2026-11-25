import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TenantStore } from '../tenant-context/tenant.store';
import { OutletSwitcherStore } from '../outlet-context/outlet-switcher.store';
import { TokenStorageService, AuthStateService } from '@nukkadnow/auth-client';
import { Subject } from 'rxjs';

/**
 * MerchantAuthStore holds the currently authenticated merchant's session context.
 *
 * Authentication is done through the real OTP flow in AuthStore / AuthApi.
 * This store picks up the resulting session from TokenStorageService /
 * AuthStateService and exposes it to the rest of the app.
 *
 * No hardcoded accounts. No seeded bypass.
 */
export interface ActiveMerchant {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  roles: string[];
  tenantId: string;
  outletId: string;
  merchantName: string;
  locality: string;
  city: string;
}

@Injectable({
  providedIn: 'root'
})
export class MerchantAuthStore {
  private readonly tenantStore = inject(TenantStore);
  private readonly outletStore = inject(OutletSwitcherStore);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);

  /** Fired after a successful login / session restore so components reload data. */
  readonly tenantSwitched$ = new Subject<string>();

  readonly activeMerchant = signal<ActiveMerchant | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly authError = signal<string | null>(null);
  /** Kept for components that still reference isSwitcherOpen; always false in this flow. */
  readonly isSwitcherOpen = signal<boolean>(false);

  readonly isAuthenticated = computed(() => !!this.activeMerchant());
  readonly isAdmin = computed(() => {
    const m = this.activeMerchant();
    return !!m && (m.roles.includes('PLATFORM_ADMIN') || m.roles.includes('SUPER_ADMIN'));
  });

  constructor() {
    this.restoreSession();
  }

  /**
   * Called by AuthStore after OTP verification succeeds.
   * Receives the authenticated user payload from the JWT response.
   */
  applyVerifiedSession(user: {
    id: string;
    email?: string;
    phoneNumber?: string;
    fullName?: string;
    merchantName?: string;
    roles: string[];
    tenantId: string;
    outletId: string;
    locality?: string;
    city?: string;
  }): void {
    const merchant: ActiveMerchant = {
      id: user.id,
      fullName: user.fullName || user.merchantName || '',
      phoneNumber: user.phoneNumber || '',
      email: user.email || '',
      roles: user.roles,
      tenantId: user.tenantId,
      outletId: user.outletId,
      merchantName: user.merchantName || user.fullName || '',
      locality: user.locality || '',
      city: user.city || '',
    };

    this.activeMerchant.set(merchant);
    this.tenantStore.setTenant(merchant.tenantId, merchant.merchantName);
    if (merchant.outletId) {
      this.outletStore.setOutletForMerchant(
        merchant.outletId,
        merchant.merchantName,
        merchant.locality,
        merchant.city
      );
    }
    localStorage.setItem('nk_active_tenant_id', merchant.tenantId);
    localStorage.setItem(
      'nk_active_merchant_meta',
      JSON.stringify({
        merchantName: merchant.merchantName,
        locality: merchant.locality,
        city: merchant.city,
      })
    );
    this.tenantSwitched$.next(merchant.tenantId);
  }

  /** Restores session from stored token + authState on app reload. */
  private restoreSession(): void {
    const token = this.tokenStorage.getAccessToken();
    if (!token) return;

    const authUser = this.authState.user();
    if (!authUser?.tenantId) return;

    let savedMeta: any = {};
    try {
      const rawMeta = localStorage.getItem('nk_active_merchant_meta');
      if (rawMeta) savedMeta = JSON.parse(rawMeta);
    } catch {}

    const merchant: ActiveMerchant = {
      id: authUser.id,
      fullName: authUser.name || '',
      phoneNumber: authUser.phone || '',
      email: authUser.email || '',
      roles: (authUser.roles as unknown as string[]) || [],
      tenantId: authUser.tenantId,
      outletId: authUser.outletId || '',
      merchantName: savedMeta.merchantName || (authUser as any).merchantName || authUser.name || '',
      locality: savedMeta.locality || '',
      city: savedMeta.city || '',
    };

    this.activeMerchant.set(merchant);
    this.tenantStore.setTenant(merchant.tenantId, merchant.merchantName);
    if (merchant.outletId) {
      this.outletStore.setOutletForMerchant(
        merchant.outletId,
        merchant.merchantName,
        merchant.locality,
        merchant.city
      );
    }
    this.tenantSwitched$.next(merchant.tenantId);
  }

  logout(): void {
    this.tokenStorage.clear();
    this.authState.logout();
    localStorage.removeItem('nk_active_tenant_id');
    localStorage.removeItem('nk_active_merchant_meta');
    localStorage.removeItem('nk_active_terminal_staff');
    localStorage.removeItem('nk_staff_shift_token');
    this.activeMerchant.set(null);
    this.router.navigate(['/auth/login'], { queryParams: { mode: 'login' } });
  }
}
