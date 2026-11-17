import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { TenantStore } from '../tenant-context/tenant.store';
import { TokenStorageService, AuthStateService, AuthUser } from '@nukkadnow/auth-client';

export interface SeededMerchantAccount {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  roles: string[];
  tenantId: string;
  outletId: string;
  merchantName: string;
  businessType: string;
  category: string;
  locality: string;
  city: string;
  applicationId: string;
  avatarIcon: string;
  status: 'APPROVED' | 'UNDER_REVIEW' | 'VERIFIED';
}

@Injectable({
  providedIn: 'root'
})
export class MerchantAuthStore {
  private readonly http = inject(HttpClient);
  private readonly tenantStore = inject(TenantStore);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly authState = inject(AuthStateService);

  // 4 Core Seeded Merchants + Platform Admin
  readonly seededMerchants: SeededMerchantAccount[] = [
    {
      id: 'user-sabji-001',
      fullName: 'Vinod Patil',
      phoneNumber: '+91 98230 11223',
      email: 'vinod.patil@patilsabji.com',
      roles: ['MERCHANT_OWNER'],
      tenantId: 'merchant-sabji-001',
      outletId: 'outlet-sabji-001',
      merchantName: 'Patil Fresh Sabji Mandi',
      businessType: 'retail',
      category: 'Vegetables & Fruits',
      locality: 'Sitabuldi',
      city: 'Nagpur',
      applicationId: 'NN-MR-20261114-1101',
      avatarIcon: '🥦',
      status: 'APPROVED'
    },
    {
      id: 'user-kirana-002',
      fullName: 'Rajesh Sharma',
      phoneNumber: '+91 98765 43210',
      email: 'rajesh@sharmakirana.com',
      roles: ['MERCHANT_OWNER'],
      tenantId: 'merchant-kirana-002',
      outletId: 'outlet-kirana-002',
      merchantName: 'Sharma Kirana & General Store',
      businessType: 'retail',
      category: 'Grocery & Daily Needs',
      locality: 'Civil Lines',
      city: 'Akola',
      applicationId: 'NN-MR-20261115-0387',
      avatarIcon: '🌾',
      status: 'APPROVED'
    },
    {
      id: 'user-garguti-003',
      fullName: 'Sunita Kulkarni',
      phoneNumber: '+91 98221 44556',
      email: 'sunita.kulkarni@gargutichivda.in',
      roles: ['MERCHANT_OWNER'],
      tenantId: 'merchant-garguti-003',
      outletId: 'outlet-garguti-003',
      merchantName: 'Garguti Homemade Chivda & Snacks',
      businessType: 'home',
      category: 'Home Bakery & Traditional Snacks',
      locality: 'Ramdaspeth',
      city: 'Akola',
      applicationId: 'NN-MR-20261116-2244',
      avatarIcon: '🌶️',
      status: 'APPROVED'
    },
    {
      id: 'user-sweets-004',
      fullName: 'Anand Joshi',
      phoneNumber: '+91 98900 77889',
      email: 'anand.joshi@mahalaxmisweets.com',
      roles: ['MERCHANT_OWNER'],
      tenantId: 'merchant-sweets-004',
      outletId: 'outlet-sweets-004',
      merchantName: 'Mahalaxmi Sweets, Dairy & Bakery',
      businessType: 'retail',
      category: 'Dairy, Sweets & Bakery',
      locality: 'Dharampeth',
      city: 'Nagpur',
      applicationId: 'NN-MR-20261117-4912',
      avatarIcon: '🍰',
      status: 'APPROVED'
    },
    {
      id: 'user-admin-001',
      fullName: 'System Admin & Auditor',
      phoneNumber: '+91 99999 00001',
      email: 'admin@nukkadnow.com',
      roles: ['PLATFORM_ADMIN', 'SUPER_ADMIN'],
      tenantId: 'system-admin-tenant',
      outletId: '',
      merchantName: 'NukkadNow Platform Governance',
      businessType: 'admin',
      category: 'Platform Administration',
      locality: 'Central HQ',
      city: 'Nagpur',
      applicationId: '',
      avatarIcon: '🛡️',
      status: 'VERIFIED'
    }
  ];

  // Active Merchant State
  readonly activeMerchant = signal<SeededMerchantAccount>(this.seededMerchants[1]); // Default to Sharma Kirana
  readonly isSwitcherOpen = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly authError = signal<string | null>(null);

  readonly isAuthenticated = computed(() => !!this.activeMerchant());
  readonly isAdmin = computed(() => this.activeMerchant().roles.includes('PLATFORM_ADMIN') || this.activeMerchant().roles.includes('SUPER_ADMIN'));

  constructor() {
    this.initSession();
  }

  private initSession(): void {
    const savedTenantId = localStorage.getItem('nk_active_tenant_id');
    if (savedTenantId) {
      const match = this.seededMerchants.find(m => m.tenantId === savedTenantId);
      if (match) {
        this.applyMerchantContext(match, false);
        return;
      }
    }
    // Default apply Kirana
    this.applyMerchantContext(this.seededMerchants[1], false);
  }

  toggleSwitcher(): void {
    this.isSwitcherOpen.update(v => !v);
  }

  closeSwitcher(): void {
    this.isSwitcherOpen.set(false);
  }

  /**
   * Switches active merchant, synchronizes tenant token, and updates global tenant context
   */
  switchMerchant(account: SeededMerchantAccount): void {
    this.isLoading.set(true);
    this.isSwitcherOpen.set(false);

    // Call backend login to get a real signed JWT for this tenant
    const loginUrl = `${environment.apiGatewayUrl}/merchant/auth/login`;
    this.http.post<any>(loginUrl, { phoneNumber: account.phoneNumber }).subscribe({
      next: res => {
        if (res?.accessToken) {
          this.tokenStorage.setAccessToken(res.accessToken);
          if (res?.refreshToken) this.tokenStorage.setRefreshToken(res.refreshToken);
        }
        this.applyMerchantContext(account, true);
        this.isLoading.set(false);
      },
      error: () => {
        // Fallback for standalone frontend execution
        this.applyMerchantContext(account, true);
        this.isLoading.set(false);
      }
    });
  }

  private applyMerchantContext(account: SeededMerchantAccount, notifyState: boolean): void {
    this.activeMerchant.set(account);
    this.tenantStore.setTenant(account.tenantId, account.merchantName);
    localStorage.setItem('nk_active_tenant_id', account.tenantId);

    const user: AuthUser = {
      id: account.id,
      phone: account.phoneNumber,
      name: account.fullName,
      email: account.email,
      roles: account.roles as any,
      tenantId: account.tenantId,
      outletId: account.outletId
    };

    this.authState.setUser(user);

    // Generate lightweight dev token if not present
    if (!this.tokenStorage.getAccessToken()) {
      const fakeToken = btoa(JSON.stringify({
        sub: account.id,
        phone: account.phoneNumber,
        roles: account.roles,
        tenantId: account.tenantId,
        outletId: account.outletId,
        merchantName: account.merchantName,
        exp: Math.floor(Date.now() / 1000) + 86400
      }));
      this.tokenStorage.setAccessToken(`dev.${fakeToken}.sig`);
    }
  }

  logout(): void {
    this.tokenStorage.clear();
    this.authState.logout();
    localStorage.removeItem('nk_active_tenant_id');
    this.applyMerchantContext(this.seededMerchants[1], true);
  }
}
