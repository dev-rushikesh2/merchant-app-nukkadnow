import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MerchantAuthStore } from '../../../core/auth/merchant-auth.store';

@Component({
  selector: 'merchant-registration-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="reg-top-bar">
      @if (showBack()) {
        <button type="button" class="back-btn" (click)="back.emit()" aria-label="Go back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
      }

      <div class="brand-center-lockup">
        <div class="brand-logo-row">
          <!-- Storefront SVG Logo -->
          <div class="store-awning-logo">
            <svg width="34" height="28" viewBox="0 0 40 32" fill="none">
              <path d="M4 14L8 4H32L36 14H4Z" fill="#FF5A1F" />
              <path d="M4 14C4 16.2 5.8 18 8 18C10.2 18 12 16.2 12 14C12 16.2 13.8 18 16 18C18.2 18 20 16.2 20 14C20 16.2 21.8 18 24 18C26.2 18 28 16.2 28 14C28 16.2 29.8 18 32 18C34.2 18 36 16.2 36 14H4Z" fill="#EA580C" />
              <rect x="7" y="18" width="26" height="12" rx="2" fill="#0284C7" />
              <rect x="10" y="21" width="8" height="9" rx="1.5" fill="#38BDF8" />
              <rect x="22" y="21" width="8" height="9" rx="1.5" fill="#F8FAFC" />
            </svg>
          </div>

          <div class="brand-text">
            <span class="nukkad">Nukkad</span><span class="now">Now</span>
          </div>

          <span class="partner-badge">Partner</span>
        </div>

        <p class="brand-tagline">Your Neighbourhood Business Platform</p>
      </div>

      <!-- Authenticated Merchant Pill -->
      <div class="auth-tenant-lockup">
        @if (authStore.activeMerchant()) {
          <div class="merchant-pill">
            <span class="merchant-icon">🏪</span>
            <div class="merchant-info">
              <span class="merchant-name">{{ authStore.activeMerchant()!.merchantName }}</span>
              <span class="merchant-role">{{ authStore.isAdmin() ? 'ADMIN' : 'MERCHANT' }}</span>
            </div>
          </div>
        }
      </div>
    </header>

    <div class="title-heading-row">
      <h1 class="main-page-title">{{ title() }}</h1>
      @if (subtitle()) {
        <p class="main-page-subtitle">{{ subtitle() }}</p>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      position: relative;
    }

    .reg-top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      padding: clamp(8px, 1.8vh, 14px) 16px;
      min-height: 56px;
      gap: 12px;
    }

    .back-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1px solid #E2E8F0;
      background: #FFFFFF;
      color: #0F172A;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      transition: all 0.15s ease;
      flex-shrink: 0;

      &:hover {
        background: #F8FAFC;
        border-color: #CBD5E1;
      }
      &:active {
        transform: scale(0.95);
      }
    }

    .brand-center-lockup {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      flex: 1;
    }

    .brand-logo-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .store-awning-logo {
      display: flex;
      align-items: center;
    }

    .brand-text {
      font-size: clamp(19px, 4vw, 23px);
      font-weight: 800;
      letter-spacing: -0.4px;
      line-height: 1;

      .nukkad {
        color: #0F172A;
      }
      .now {
        color: #FF5A1F;
        margin-left: 1px;
      }
    }

    .partner-badge {
      background: #DCFCE7;
      color: #15803D;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 9999px;
      letter-spacing: 0.2px;
    }

    .brand-tagline {
      font-size: 11px;
      color: #64748B;
      font-weight: 500;
      margin-top: 2px;
    }

    /* Authenticated Merchant Pill */
    .auth-tenant-lockup {
      flex-shrink: 0;
    }

    .merchant-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: #FFFFFF;
      border: 1.5px solid #E2E8F0;
      border-radius: 9999px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);

      .merchant-icon {
        font-size: 18px;
        line-height: 1;
      }

      .merchant-info {
        display: flex;
        flex-direction: column;
        align-items: flex-start;

        .merchant-name {
          font-size: 12px;
          font-weight: 700;
          color: #0F172A;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 130px;
        }

        .merchant-role {
          font-size: 10px;
          font-weight: 700;
          color: #FF5A1F;
        }
      }
    }

    .title-heading-row {
      text-align: center;
      margin-top: 14px;
      margin-bottom: 12px;
      padding: 0 16px;

      .main-page-title {
        font-size: clamp(21px, 4.8vw, 26px);
        font-weight: 800;
        color: #0F172A;
        letter-spacing: -0.4px;
        line-height: 1.2;
      }

      .main-page-subtitle {
        font-size: 13px;
        color: #64748B;
        font-weight: 500;
        margin-top: 4px;
      }
    }

    @media (max-width: 600px) {
      .reg-top-bar {
        flex-wrap: wrap;
      }
      .tenant-pill-btn {
        max-width: 170px;
        .tenant-info-mini .tenant-name {
          max-width: 90px;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistrationHeaderComponent {
  readonly authStore = inject(MerchantAuthStore);

  title = input<string>('Register Your Business');
  subtitle = input<string>('');
  showBack = input<boolean>(true);
  back = output<void>();
}
