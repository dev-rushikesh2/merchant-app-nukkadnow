import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthApi } from '../data-access/auth.api';
import { TokenStorageService, AuthStateService } from '@nukkadnow/auth-client';
import { TenantStore } from '../../../core/tenant-context/tenant.store';
import { OutletSwitcherStore } from '../../../core/outlet-context/outlet-switcher.store';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private api = inject(AuthApi);
  private tokenStorage = inject(TokenStorageService);
  private authState = inject(AuthStateService);
  private tenantStore = inject(TenantStore);
  private outletStore = inject(OutletSwitcherStore);
  private router = inject(Router);

  readonly email = signal<string>('');
  readonly phoneNumber = signal<string>('');
  readonly identifier = signal<string>('');
  readonly challengeId = signal<string | null>(null);
  readonly cooldownSeconds = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly attemptsLeft = signal<number>(3);

  private timerInterval: any = null;

  setIdentifier(value: string) {
    this.identifier.set(value.trim());
    if (value.includes('@')) {
      this.email.set(value.trim());
    } else {
      this.phoneNumber.set(value.trim());
    }
  }

  sendOtp(identifierValue: string, onSuccess?: () => void) {
    const clean = identifierValue.trim();
    if (!clean) {
      this.error.set('Please enter a valid email address');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.setIdentifier(clean);

    this.api.requestOtp(clean).subscribe({
      next: (res) => {
        this.challengeId.set(res.challengeId || 'challenge-' + Date.now());
        this.startCooldown(res.cooldownSeconds || 60);
        this.loading.set(false);
        if (onSuccess) {
          onSuccess();
        } else {
          this.router.navigate(['/auth/verify-otp'], { queryParams: { email: clean } });
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Failed to send OTP email. Please verify email and try again.');
      }
    });
  }

  verifyOtp(otp: string) {
    const target = this.identifier() || this.email() || this.phoneNumber();
    if (!target) {
      this.error.set('Session expired. Please enter your email again.');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.api.verifyOtp(this.challengeId(), target, otp).subscribe({
      next: (res) => {
        if (res.accessToken) {
          this.tokenStorage.setAccessToken(res.accessToken);
        }
        if (res.refreshToken) {
          this.tokenStorage.setRefreshToken(res.refreshToken);
        }

        const user = {
          id: res.user.id,
          phone: res.user.phoneNumber || '+91 98000 00000',
          email: res.user.email || target,
          name: res.user.fullName || res.user.merchantName || target.split('@')[0],
          roles: res.user.roles,
          tenantId: res.user.tenantId,
          outletId: res.user.outletId,
        };

        this.authState.setUser(user as any);

        if (res.user.tenantId) {
          this.tenantStore.setTenant(res.user.tenantId, res.user.merchantName || 'Merchant Store');
          localStorage.setItem('nk_active_tenant_id', res.user.tenantId);
        }
        if (res.user.outletId) {
          this.outletStore.setOutletForMerchant(
            res.user.outletId,
            res.user.merchantName || 'Main Outlet',
            'Locality',
            'Nagpur'
          );
        }

        this.loading.set(false);
        this.clearTimer();
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.attemptsLeft.update((a) => Math.max(0, a - 1));
        this.error.set(err.message || 'Invalid verification code. Please check and retry.');
      }
    });
  }

  resendOtp() {
    if (this.cooldownSeconds() > 0) return;
    const target = this.identifier() || this.email() || this.phoneNumber();
    if (target) {
      this.sendOtp(target);
    }
  }

  private startCooldown(seconds: number) {
    this.clearTimer();
    this.cooldownSeconds.set(seconds);
    this.timerInterval = setInterval(() => {
      this.cooldownSeconds.update((s) => {
        if (s <= 1) {
          this.clearTimer();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  private clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
