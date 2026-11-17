import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MerchantAuthStore, SeededMerchantAccount } from '../../../core/auth/merchant-auth.store';
import { BusinessRegistrationStore } from '../state/business-registration.store';

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

      <!-- Multi-tenant Merchant & Auth Switcher Pill -->
      <div class="auth-tenant-lockup">
        <button
          type="button"
          class="tenant-pill-btn"
          (click)="authStore.toggleSwitcher()"
          [title]="'Active Merchant: ' + authStore.activeMerchant().merchantName"
          aria-label="Switch Merchant Tenant"
        >
          <span class="tenant-icon">{{ authStore.activeMerchant().avatarIcon }}</span>
          <div class="tenant-info-mini">
            <span class="tenant-name">{{ authStore.activeMerchant().merchantName }}</span>
            <span class="tenant-sub">
              {{ authStore.activeMerchant().locality }} · 
              <span class="auth-role-tag">{{ authStore.isAdmin() ? 'ADMIN' : 'MERCHANT' }}</span>
            </span>
          </div>
          <svg class="chevron-icon" [class.rotated]="authStore.isSwitcherOpen()" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        <!-- Dropdown Menu for 4 Seeded Merchants + Platform Admin -->
        @if (authStore.isSwitcherOpen()) {
          <div class="tenant-dropdown-menu" role="dialog" aria-label="Select Merchant Tenant">
            <div class="dropdown-header">
              <div class="header-titles">
                <span class="section-tag">AUTHENTICATION & ISOLATION</span>
                <span class="section-title">Select Active Merchant Context</span>
              </div>
              <button type="button" class="close-drop-btn" (click)="authStore.closeSwitcher()">✕</button>
            </div>

            <div class="dropdown-list">
              @for (account of authStore.seededMerchants; track account.id) {
                <button
                  type="button"
                  class="tenant-option-card"
                  [class.is-active]="authStore.activeMerchant().id === account.id"
                  (click)="onSelectMerchant(account)"
                >
                  <div class="option-avatar">{{ account.avatarIcon }}</div>
                  <div class="option-details">
                    <div class="option-row-1">
                      <span class="option-name">{{ account.merchantName }}</span>
                      @if (authStore.activeMerchant().id === account.id) {
                        <span class="active-badge">Active</span>
                      }
                    </div>
                    <div class="option-row-2">
                      <span class="option-owner">{{ account.fullName }} ({{ account.phoneNumber }})</span>
                    </div>
                    <div class="option-row-3">
                      <span class="category-chip">{{ account.category }}</span>
                      <span class="locality-chip">{{ account.locality }}, {{ account.city }}</span>
                      @if (account.applicationId) {
                        <span class="app-chip">{{ account.applicationId }}</span>
                      }
                    </div>
                  </div>
                </button>
              }
            </div>

            <div class="dropdown-footer">
              <span class="isolation-note">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Strict Tenant Isolation: API tokens & data requests are strictly scoped to the active merchant.
              </span>
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

    /* Tenant Switcher Lockup */
    .auth-tenant-lockup {
      position: relative;
      flex-shrink: 0;
    }

    .tenant-pill-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: #FFFFFF;
      border: 1.5px solid #E2E8F0;
      border-radius: 9999px;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
      transition: all 0.2s ease;
      max-width: 240px;

      &:hover {
        border-color: #FF5A1F;
        box-shadow: 0 3px 8px rgba(255, 90, 31, 0.12);
        background: #FFF7ED;
      }

      .tenant-icon {
        font-size: 18px;
        line-height: 1;
      }

      .tenant-info-mini {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        text-align: left;
        overflow: hidden;

        .tenant-name {
          font-size: 12px;
          font-weight: 700;
          color: #0F172A;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }

        .tenant-sub {
          font-size: 10px;
          color: #64748B;
          font-weight: 500;

          .auth-role-tag {
            color: #FF5A1F;
            font-weight: 700;
          }
        }
      }

      .chevron-icon {
        color: #64748B;
        transition: transform 0.2s ease;

        &.rotated {
          transform: rotate(180deg);
        }
      }
    }

    /* Dropdown Menu */
    .tenant-dropdown-menu {
      position: absolute;
      right: 0;
      top: calc(100% + 8px);
      width: min(380px, 92vw);
      background: #FFFFFF;
      border: 1.5px solid #E2E8F0;
      border-radius: 16px;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.05);
      z-index: 1000;
      overflow: hidden;
      animation: dropFadeIn 0.18s ease-out;
    }

    @keyframes dropFadeIn {
      from {
        opacity: 0;
        transform: translateY(-6px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .dropdown-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #F8FAFC;
      border-bottom: 1px solid #E2E8F0;

      .header-titles {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .section-tag {
          font-size: 9.5px;
          font-weight: 800;
          color: #FF5A1F;
          letter-spacing: 0.6px;
        }

        .section-title {
          font-size: 13px;
          font-weight: 700;
          color: #0F172A;
        }
      }

      .close-drop-btn {
        background: transparent;
        border: none;
        color: #64748B;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;

        &:hover {
          color: #0F172A;
          background: #E2E8F0;
        }
      }
    }

    .dropdown-list {
      max-height: 380px;
      overflow-y: auto;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .tenant-option-card {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1.5px solid transparent;
      background: #FFFFFF;
      cursor: pointer;
      text-align: left;
      width: 100%;
      transition: all 0.15s ease;

      &:hover {
        background: #F8FAFC;
        border-color: #CBD5E1;
      }

      &.is-active {
        background: #FFF7ED;
        border-color: #FF5A1F;
      }

      .option-avatar {
        font-size: 24px;
        line-height: 1;
        padding-top: 2px;
      }

      .option-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;

        .option-row-1 {
          display: flex;
          align-items: center;
          justify-content: space-between;

          .option-name {
            font-size: 13.5px;
            font-weight: 700;
            color: #0F172A;
          }

          .active-badge {
            background: #FF5A1F;
            color: #FFFFFF;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 7px;
            border-radius: 9999px;
          }
        }

        .option-row-2 {
          .option-owner {
            font-size: 11.5px;
            color: #475569;
            font-weight: 500;
          }
        }

        .option-row-3 {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 4px;

          .category-chip, .locality-chip, .app-chip {
            font-size: 10px;
            font-weight: 600;
            padding: 2px 6px;
            border-radius: 4px;
          }

          .category-chip {
            background: #EFF6FF;
            color: #1D4ED8;
          }

          .locality-chip {
            background: #F1F5F9;
            color: #475569;
          }

          .app-chip {
            background: #F0FDF4;
            color: #15803D;
            font-family: monospace;
          }
        }
      }
    }

    .dropdown-footer {
      padding: 10px 14px;
      background: #F8FAFC;
      border-top: 1px solid #E2E8F0;

      .isolation-note {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 10.5px;
        color: #059669;
        font-weight: 600;
        line-height: 1.3;
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
  readonly regStore = inject(BusinessRegistrationStore);

  title = input<string>('Register Your Business');
  subtitle = input<string>('');
  showBack = input<boolean>(true);
  back = output<void>();

  onSelectMerchant(account: SeededMerchantAccount): void {
    this.authStore.switchMerchant(account);
    if (account.tenantId) {
      this.regStore.loadMerchantPreset(account.tenantId);
    }
  }
}
