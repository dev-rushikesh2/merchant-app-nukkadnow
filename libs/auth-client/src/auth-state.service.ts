import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthUser } from './auth.models';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private tokenStorage = inject(TokenStorageService);
  private currentUserSignal = signal<AuthUser | null>(this.getStoredUser());

  readonly user = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());

  private getStoredUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem('nk_merchant_user');
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {}
    return null;
  }

  setUser(user: AuthUser | null) {
    if (user) {
      localStorage.setItem('nk_merchant_user', JSON.stringify(user));
      this.tokenStorage.setAccessToken('live-merchant-token-' + (user.id || 'default'));
    } else {
      localStorage.removeItem('nk_merchant_user');
      this.tokenStorage.clear();
    }
    this.currentUserSignal.set(user);
  }

  logout() {
    this.setUser(null);
  }
}
