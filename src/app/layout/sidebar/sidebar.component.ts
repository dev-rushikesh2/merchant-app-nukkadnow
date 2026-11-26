import { Component, ChangeDetectionStrategy, inject, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { StaffPermissionStore } from '../../core/permissions/staff-permission.store';

@Component({
  selector: 'merchant-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-logo-mark">
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
            <path d="M14 16V12C14 8.686 16.686 6 20 6C23.314 6 26 8.686 26 12V16" stroke="#FF5A1F" stroke-width="3" stroke-linecap="round"/>
            <path d="M8 16H32L34 23H6L8 16Z" fill="#FF5A1F"/>
            <rect x="7" y="22" width="26" height="15" rx="5" fill="#2E1065"/>
            <path d="M20 25C18.343 25 17 26.343 17 28C17 30.5 20 33 20 33C20 33 23 30.5 23 28C23 26.343 21.657 25 20 25Z" fill="#FF5A1F"/>
            <circle cx="20" cy="28" r="1.5" fill="#FFFFFF"/>
          </svg>
        </div>
        <div class="brand-text">
          <span class="brand-name">NukkadNow</span>
          <span class="badge">Merchant</span>
        </div>
        <button type="button" class="close-drawer-btn" (click)="close.emit()" aria-label="Close menu">✕</button>
      </div>

      @if (permStore.activeTerminalStaff(); as staff) {
        <div class="staff-mode-banner">
          <span class="staff-mode-dot"></span>
          <div class="staff-mode-info">
            <strong>{{ staff.name }}</strong>
            <span>{{ staff.role }}</span>
          </div>
        </div>
      }

      <nav class="nav-menu">
        <div class="nav-section">Operations</div>
        <a routerLink="/dashboard" (click)="close.emit()" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-link">
          <span class="link-icon">📊</span>
          <span>Dashboard</span>
        </a>
        @if (canAccess('orders:view')) {
          <a routerLink="/order-inbox" (click)="close.emit()" routerLinkActive="active" class="nav-link">
            <span class="link-icon">🔔</span>
            <span>Order Inbox</span>
          </a>
        }
        @if (canAccess('pos:walkin_billing')) {
          <a routerLink="/walkin-orders" (click)="close.emit()" routerLinkActive="active" class="nav-link">
            <span class="link-icon">🧾</span>
            <span>Walk-in Order POS</span>
          </a>
        }
        @if (canAccess('orders:view')) {
          <a routerLink="/queue-board" (click)="close.emit()" routerLinkActive="active" class="nav-link">
            <span class="link-icon">📋</span>
            <span>Queue Management</span>
          </a>
        }

        @if (canAccessAny(['catalog:view', 'inventory:view', 'orders:view'])) {
          <div class="nav-section">Catalogue &amp; Stock</div>
        }
        @if (canAccess('catalog:view')) {
          <a routerLink="/catalogue" (click)="close.emit()" routerLinkActive="active" class="nav-link">
            <span class="link-icon">📦</span>
            <span>Products</span>
          </a>
        }
        @if (canAccess('inventory:view')) {
          <a routerLink="/inventory" (click)="close.emit()" routerLinkActive="active" class="nav-link">
            <span class="link-icon">📉</span>
            <span>Inventory Overview</span>
          </a>
        }
        @if (canAccess('orders:view')) {
          <a routerLink="/preorders" (click)="close.emit()" routerLinkActive="active" class="nav-link">
            <span class="link-icon">📅</span>
            <span>Pre-orders</span>
          </a>
        }

        @if (canAccessAny(['capacity:manage', 'delivery:manage', 'staff:manage', 'audit:view'])) {
          <div class="nav-section">Fulfillment &amp; Rules</div>
        }
        @if (canAccess('capacity:manage')) {
          <a routerLink="/capacity-settings" (click)="close.emit()" routerLinkActive="active" class="nav-link">
            <span class="link-icon">⚙️</span>
            <span>Capacity &amp; Slots</span>
          </a>
        }
        @if (canAccess('delivery:manage')) {
          <a routerLink="/delivery-settings" (click)="close.emit()" routerLinkActive="active" class="nav-link">
            <span class="link-icon">🛵</span>
            <span>Delivery Management</span>
          </a>
        }
        @if (canAccess('staff:manage')) {
          <a routerLink="/staff-access" (click)="close.emit()" routerLinkActive="active" class="nav-link">
            <span class="link-icon">👥</span>
            <span>Staff Management</span>
          </a>
        }
        @if (canAccess('audit:view')) {
          <a routerLink="/audit-logs" (click)="close.emit()" routerLinkActive="active" class="nav-link">
            <span class="link-icon">🛡️</span>
            <span>Activity Logs</span>
          </a>
        }

        <div class="nav-section">Store Management</div>
        @if (canAccess('profile:edit')) {
          <a routerLink="/business-profile" (click)="close.emit()" routerLinkActive="active" class="nav-link">
            <span class="link-icon">🏪</span>
            <span>Shop Profile</span>
          </a>
        }
        @if (canAccess('profile:edit')) {
          <a routerLink="/qr-ordering" (click)="close.emit()" routerLinkActive="active" class="nav-link">
            <span class="link-icon">📱</span>
            <span>Shop QR &amp; Ordering</span>
          </a>
        }
        @if (canAccess('analytics:view')) {
          <a routerLink="/analytics" (click)="close.emit()" routerLinkActive="active" class="nav-link">
            <span class="link-icon">📈</span>
            <span>Business Analytics</span>
          </a>
        }
        @if (canAccess('billing:manage')) {
          <a routerLink="/subscriptions" (click)="close.emit()" routerLinkActive="active" class="nav-link">
            <span class="link-icon">⭐</span>
            <span>Subscriptions</span>
          </a>
        }
        <a routerLink="/settings" (click)="close.emit()" routerLinkActive="active" class="nav-link">
          <span class="link-icon">⚙️</span>
          <span>Settings</span>
        </a>
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      height: 100vh;
      width: var(--sidebar-width, 260px);
      background: var(--nn-purple-950, #1E1B4B);
      color: #E2E8F0;
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 0;
      overflow-y: auto;
      flex-shrink: 0;
      border-right: 1px solid rgba(255, 255, 255, 0.08);
    }

    .brand {
      padding: 18px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      position: sticky;
      top: 0;
      background: var(--nn-purple-950, #1E1B4B);
      z-index: 10;
    }

    .brand-logo-mark {
      display: flex;
      align-items: center;
    }

    .brand-text {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;

      .brand-name {
        font-size: 1.05rem;
        font-weight: 800;
        color: #FFFFFF;
        letter-spacing: -0.01em;
      }

      .badge {
        background: var(--nn-purple-600, #6D28D9);
        color: #FFFFFF;
        font-size: 0.65rem;
        font-weight: 700;
        padding: 2px 7px;
        border-radius: 9999px;
      }
    }

    .staff-mode-banner {
      margin: 10px 10px 0;
      padding: 8px 12px;
      background: rgba(16, 185, 129, 0.14);
      border: 1px solid rgba(16, 185, 129, 0.35);
      border-radius: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .staff-mode-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10B981;
      flex-shrink: 0;
    }

    .staff-mode-info {
      display: flex;
      flex-direction: column;
      line-height: 1.25;

      strong {
        font-size: 0.78rem;
        color: #FFFFFF;
      }

      span {
        font-size: 0.68rem;
        color: #A7F3D0;
        font-weight: 600;
      }
    }

    .close-drawer-btn {
      display: none;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: #FFFFFF;
      font-size: 0.9rem;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      cursor: pointer;

      @media (max-width: 767px) {
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .nav-menu {
      padding: 12px 10px 48px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .nav-section {
      font-size: 0.675rem;
      text-transform: uppercase;
      color: #94A3B8;
      font-weight: 700;
      padding: 14px 10px 4px;
      letter-spacing: 0.05em;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 0.5rem;
      color: #CBD5E1;
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 500;
      transition: all 0.15s ease;

      .link-icon {
        font-size: 1rem;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.06);
        color: #FFFFFF;
      }

      &.active {
        background: var(--nn-purple-600, #6D28D9);
        color: #FFFFFF;
        font-weight: 700;
        box-shadow: 0 4px 12px rgba(109, 40, 217, 0.3);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  readonly permStore = inject(StaffPermissionStore);
  close = output<void>();

  canAccess(permission: string): boolean {
    if (!this.permStore.isStaffMode()) return true;
    return this.permStore.hasPermission(permission);
  }

  canAccessAny(permissions: string[]): boolean {
    if (!this.permStore.isStaffMode()) return true;
    return permissions.some((p) => this.permStore.hasPermission(p));
  }
}
