import { Injectable, signal, computed } from '@angular/core';

export interface ActiveTerminalStaff {
  id: string;
  name: string;
  phone: string;
  role: string;
  permissions: string[];
  outlet: string;
  isActive: boolean;
}

const STORAGE_KEY = 'nk_active_terminal_staff';
const SHIFT_TOKEN_KEY = 'nk_staff_shift_token';

/**
 * StaffPermissionStore manages which staff member is currently "switched in" on the POS terminal.
 *
 * When Owner logs in via OTP (or switches back via Owner PIN), activeTerminalStaff is null (Owner mode).
 * When a staff member switches in via PIN, both their ActiveTerminalStaff object AND the signed
 * server-issued `shiftToken` are persisted so every backend request enforces their live permissions
 * and attributes audit logs to them.
 */
@Injectable({ providedIn: 'root' })
export class StaffPermissionStore {
  private readonly _activeStaff = signal<ActiveTerminalStaff | null>(this._loadFromStorage());
  private readonly _shiftToken = signal<string | null>(this._loadShiftToken());

  readonly activeTerminalStaff = this._activeStaff.asReadonly();
  readonly shiftToken = this._shiftToken.asReadonly();

  /** True when a non-Owner staff member has taken control of the terminal */
  readonly isStaffMode = computed(() => this._activeStaff() !== null);

  /** All permissions the current actor has (empty when Owner — Owner has everything) */
  readonly currentPermissions = computed<string[]>(() => {
    const staff = this._activeStaff();
    return staff ? staff.permissions : [];
  });

  hasPermission(permission: string): boolean {
    const staff = this._activeStaff();
    if (!staff) return true; // Owner has full access
    return staff.permissions.includes(permission);
  }

  can(permission: string) {
    return computed(() => {
      const staff = this._activeStaff();
      if (!staff) return true;
      return staff.permissions.includes(permission);
    });
  }

  setActiveStaff(member: ActiveTerminalStaff, shiftToken?: string | null): void {
    if (String(member.role || '').toUpperCase() === 'OWNER') {
      this.clearActiveStaff();
      return;
    }
    this._activeStaff.set(member);
    if (shiftToken) {
      this._shiftToken.set(shiftToken);
      try {
        localStorage.setItem(SHIFT_TOKEN_KEY, shiftToken);
      } catch {}
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(member));
    } catch {}
  }

  clearActiveStaff(): void {
    this._activeStaff.set(null);
    this._shiftToken.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SHIFT_TOKEN_KEY);
    } catch {}
  }

  private _loadFromStorage(): ActiveTerminalStaff | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.id || !Array.isArray(parsed?.permissions)) return null;
      return parsed as ActiveTerminalStaff;
    } catch {
      return null;
    }
  }

  private _loadShiftToken(): string | null {
    try {
      return localStorage.getItem(SHIFT_TOKEN_KEY);
    } catch {
      return null;
    }
  }
}
