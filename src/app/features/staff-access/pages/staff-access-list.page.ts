import { Component, inject, signal, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  ROLE_PERMISSIONS,
  MerchantPermission,
} from '@nukkadnow/auth-client';
import { MerchantAuthStore } from '../../../core/auth/merchant-auth.store';
import { StaffPermissionStore } from '../../../core/permissions/staff-permission.store';
import { StaffAccessApi } from '../data-access/staff-access.api';

/** Preset templates used to pre-fill permission checkboxes — NOT the enforced role type. */
type PermissionPreset = 'CASHIER' | 'MANAGER' | 'CHEF' | 'INVENTORY';

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  /** Owner-defined free-text role label (e.g. "Floor Boy", "Delivery Partner") */
  role: string;
  pin: string;
  outlet: string;
  isActive: boolean;
  lastActive: string;
  permissions: string[];
}

@Component({
  selector: 'merchant-staff-access-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './staff-access-list.page.html',
  styleUrls: ['./staff-access-list.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StaffAccessListPageComponent implements OnInit, OnDestroy {
  private authStore = inject(MerchantAuthStore);
  private permStore = inject(StaffPermissionStore);
  private staffApi = inject(StaffAccessApi);
  private sub = new Subscription();

  readonly permissionGroups = PERMISSION_GROUPS;
  readonly permissionLabels = PERMISSION_LABELS as Record<string, string>;

  // Active Staff using this terminal
  readonly activeStaff = signal<StaffMember>({
    id: '',
    name: '',
    phone: '',
    role: 'OWNER',
    pin: '1234',
    outlet: '',
    isActive: true,
    lastActive: 'Active Now',
    permissions: [...ROLE_PERMISSIONS.OWNER],
  });

  // Staff Roster
  readonly staffList = signal<StaffMember[]>([]);

  // Masked PINs toggle state
  readonly revealedPins = signal<Record<string, boolean>>({});

  // Modals
  readonly showPinSwitchModal = signal<boolean>(false);
  readonly showInviteModal = signal<boolean>(false);
  readonly showEditPermsModal = signal<boolean>(false);

  // Keypad PIN input
  readonly enteredPin = signal<string>('');
  readonly pinError = signal<string | null>(null);

  // Invite Form — role is a free-text label; preset is a convenience template only
  readonly newName = signal<string>('');
  readonly newPhone = signal<string>('');
  readonly newRoleLabel = signal<string>('');          // owner-defined free-text role name
  readonly newPreset = signal<PermissionPreset>('CASHIER');  // permissions template only
  readonly newPin = signal<string>('');
  readonly invitePermissions = signal<string[]>([...ROLE_PERMISSIONS.CASHIER]);

  // Edit Permissions Form — role label is free-text; preset auto-fills permissions only
  readonly editingStaff = signal<StaffMember | null>(null);
  readonly editRoleLabel = signal<string>('');         // owner-defined free-text role name
  readonly editPreset = signal<PermissionPreset>('CASHIER');
  readonly editPermissions = signal<string[]>([]);

  // Toast
  readonly toast = signal<string | null>(null);

  ngOnInit(): void {
    this.syncStaffWithActiveMerchant();
    this.sub.add(
      this.authStore.tenantSwitched$.subscribe(() => {
        this.syncStaffWithActiveMerchant();
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private syncStaffWithActiveMerchant(): void {
    const m = this.authStore.activeMerchant();
    if (!m) return;
    const fallbackOwner: StaffMember = {
      id: m.id,
      name: m.fullName,
      phone: m.phoneNumber,
      role: 'OWNER',
      pin: '1234',
      outlet: m.merchantName,
      isActive: true,
      lastActive: 'Active Now',
      permissions: [...ROLE_PERMISSIONS.OWNER],
    };

    const currentTerminal = this.permStore.activeTerminalStaff();
    this.activeStaff.set(
      currentTerminal
        ? {
            id: currentTerminal.id,
            name: currentTerminal.name,
            phone: currentTerminal.phone,
            role: currentTerminal.role || 'Staff',
            pin: '••••',
            outlet: currentTerminal.outlet || m.merchantName,
            isActive: currentTerminal.isActive,
            lastActive: 'Active Now',
            permissions: currentTerminal.permissions || [],
          }
        : fallbackOwner
    );
    this.staffList.set([fallbackOwner]);

    this.staffApi.fetchList().subscribe((rows) => {
      if (Array.isArray(rows) && rows.length > 0) {
        const normalized: StaffMember[] = rows.map((r) => ({
          ...r,
          role: String(r.role || 'Staff'),
          permissions: Array.isArray(r.permissions) ? r.permissions : [],
        }));
        this.staffList.set(normalized);
        if (currentTerminal) {
          const matched = normalized.find((r) => r.id === currentTerminal.id);
          if (matched) this.activeStaff.set(matched);
        } else {
          const owner = normalized.find((r) => this.isOwnerRole(r.role)) || normalized[0];
          if (owner) this.activeStaff.set(owner);
        }
      }
    });
  }

  isOwnerRole(role: string): boolean {
    return String(role || '').trim().toUpperCase() === 'OWNER';
  }

  getRoleClass(role: string): string {
    const key = String(role || '').trim().toLowerCase();
    if (key === 'owner' || key === 'manager' || key === 'cashier' || key === 'chef' || key === 'inventory') {
      return key;
    }
    return 'custom';
  }

  getPermLabel(perm: string): string {
    return this.permissionLabels[perm] || perm;
  }

  togglePinReveal(id: string) {
    this.revealedPins.update(map => ({
      ...map,
      [id]: !map[id]
    }));
  }

  toggleStaffActive(id: string) {
    const target = this.staffList().find(s => s.id === id);
    if (!target || this.isOwnerRole(target.role)) {
      this.showToast('Store Owner cannot be suspended.');
      return;
    }
    const nextActive = !target.isActive;
    this.staffApi.updateStaff(id, { isActive: nextActive }).subscribe({
      next: (updated) => {
        this.staffList.update(list =>
          list.map(s => s.id === id ? { ...s, isActive: updated?.isActive ?? nextActive } : s)
        );
        this.showToast(`Staff "${target.name}" ${nextActive ? 'activated' : 'suspended'}.`);
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Failed to update staff status.');
      }
    });
  }

  openPinModal() {
    this.enteredPin.set('');
    this.pinError.set(null);
    this.showPinSwitchModal.set(true);
  }

  appendPinDigit(digit: string) {
    if (this.enteredPin().length < 4) {
      const next = this.enteredPin() + digit;
      this.enteredPin.set(next);
      if (next.length === 4) {
        this.verifyAndSwitch();
      }
    }
  }

  clearPin() {
    this.enteredPin.set('');
    this.pinError.set(null);
  }

  verifyAndSwitch() {
    const pin = this.enteredPin();
    this.staffApi.verifyPin(pin).subscribe({
      next: (res) => {
        const matched = res?.member || this.staffList().find(s => s.pin === pin && s.isActive);
        if (matched) {
          this.activeStaff.set(matched);
          this.staffList.update(list => list.map(s => s.id === matched.id ? matched : s));

          if (String(matched.role).toUpperCase() === 'OWNER') {
            this.permStore.clearActiveStaff();
          } else {
            this.permStore.setActiveStaff(matched, res?.shiftToken || null);
          }

          this.showPinSwitchModal.set(false);
          this.showToast(`Device switched to ${matched.name} (${matched.role})!`);
        }
      },
      error: () => {
        this.pinError.set('Invalid or suspended staff PIN.');
        setTimeout(() => this.enteredPin.set(''), 800);
      }
    });
  }

  openInviteModal() {
    this.newName.set('');
    this.newPhone.set('');
    this.newRoleLabel.set('');
    this.newPreset.set('CASHIER');
    this.newPin.set('');
    this.invitePermissions.set([...ROLE_PERMISSIONS.CASHIER]);
    this.showInviteModal.set(true);
  }

  applyInvitePreset(preset: string) {
    const key = (preset || '').toUpperCase() as PermissionPreset;
    if (key in ROLE_PERMISSIONS) {
      this.newPreset.set(key);
      this.invitePermissions.set([...ROLE_PERMISSIONS[key]]);
    }
  }

  toggleInvitePermission(perm: MerchantPermission) {
    this.invitePermissions.update(list =>
      list.includes(perm) ? list.filter(p => p !== perm) : [...list, perm]
    );
  }

  inviteStaffMember() {
    const name = this.newName().trim();
    const phone = this.newPhone().trim();
    const roleLabel = this.newRoleLabel().trim() || 'Staff';
    const rawPin = this.newPin().trim();
    const pin = rawPin || Math.floor(1000 + Math.random() * 9000).toString();

    if (!name || phone.replace(/\D/g, '').length < 10) {
      this.showToast('Please enter full name and a valid 10-digit mobile number.');
      return;
    }
    if (roleLabel.toUpperCase() === 'OWNER') {
      this.showToast('Role name "OWNER" is reserved for the shop owner.');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      this.showToast('POS Switch PIN must be exactly 4 digits.');
      return;
    }

    const permissions = this.invitePermissions();

    this.staffApi.inviteStaff({ name, phone, role: roleLabel, pin, permissions }).subscribe({
      next: (created) => {
        const member: StaffMember = {
          ...created,
          role: String(created?.role || roleLabel),
          permissions: Array.isArray(created.permissions) ? created.permissions : permissions,
        };
        this.staffList.update(list => [...list, member]);
        this.showInviteModal.set(false);
        this.newName.set('');
        this.newPhone.set('');
        this.newRoleLabel.set('');
        this.newPin.set('');
        this.showToast(`Team member "${member.name}" (${member.role}) invited! PIN: ${member.pin}`);
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Failed to invite staff member.');
      }
    });
  }

  openEditPermissionsModal(staff: StaffMember) {
    if (this.isOwnerRole(staff.role)) return;
    this.editingStaff.set(staff);
    this.editRoleLabel.set(staff.role);
    this.editPreset.set('CASHIER');
    this.editPermissions.set([...(staff.permissions || [])]);
    this.showEditPermsModal.set(true);
  }

  applyEditPreset(preset: string) {
    const key = (preset || '').toUpperCase() as PermissionPreset;
    if (key in ROLE_PERMISSIONS) {
      this.editPreset.set(key);
      this.editPermissions.set([...ROLE_PERMISSIONS[key]]);
    }
  }

  toggleEditPermission(perm: MerchantPermission) {
    this.editPermissions.update(list =>
      list.includes(perm) ? list.filter(p => p !== perm) : [...list, perm]
    );
  }

  saveEditedPermissions() {
    const staff = this.editingStaff();
    if (!staff) return;

    const permissions = this.editPermissions();
    const roleLabel = this.editRoleLabel().trim() || staff.role;
    if (roleLabel.toUpperCase() === 'OWNER') {
      this.showToast('Role name "OWNER" is reserved for the shop owner.');
      return;
    }

    this.staffApi.updateStaff(staff.id, { role: roleLabel, permissions }).subscribe({
      next: (updated) => {
        const merged: StaffMember = {
          ...staff,
          ...updated,
          role: String(updated?.role || roleLabel),
          permissions: Array.isArray(updated?.permissions) ? updated.permissions : permissions,
        };
        this.staffList.update(list => list.map(s => s.id === staff.id ? merged : s));
        if (this.permStore.activeTerminalStaff()?.id === staff.id) {
          this.permStore.setActiveStaff(merged);
        }
        this.showEditPermsModal.set(false);
        this.editingStaff.set(null);
        this.showToast(`Updated role & permissions for "${merged.name}".`);
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Failed to update staff permissions.');
      }
    });
  }

  removeStaff(id: string, name: string) {
    this.staffApi.removeStaff(id).subscribe({
      next: () => {
        this.staffList.update(list => list.filter(s => s.id !== id));
        this.showToast(`${name} removed from store roster.`);
      },
      error: (err) => {
        this.showToast(err?.error?.message || `Failed to remove ${name}.`);
      }
    });
  }

  private showToast(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(null), 2800);
  }
}
