import { Injectable, signal, computed, inject } from '@angular/core';
import { StaffMemberViewModel, StaffStatus } from '../models/staff-access-view.model';
import { MerchantStaffRole } from '@nukkadnow/auth-client';
import { MerchantAuthStore } from '../../../core/auth/merchant-auth.store';

@Injectable()
export class StaffAccessStore {
  private authStore = inject(MerchantAuthStore);

  readonly staffList = signal<StaffMemberViewModel[]>([]);
  readonly activeStaffOnDevice = signal<StaffMemberViewModel | null>(null);
  readonly pinError = signal<string | null>(null);

  constructor() {
    this.init();
  }

  private init(): void {
    this.reloadForTenant();
    this.authStore.tenantSwitched$.subscribe(() => {
      this.reloadForTenant();
    });
  }

  private reloadForTenant(): void {
    const active = this.authStore.activeMerchant();
    const ownerStaff: StaffMemberViewModel = {
      id: `staff-${active.id}`,
      name: active.fullName,
      phoneMasked: active.phoneNumber.slice(0, 7) + '*****',
      phoneRaw: active.phoneNumber.replace(/[^0-9]/g, ''),
      role: 'OWNER',
      pin: '1111',
      assignedOutlets: [active.merchantName],
      status: 'ACTIVE',
      lastActiveAt: 'Just now'
    };

    const managerStaff: StaffMemberViewModel = {
      id: `staff-mgr-${active.tenantId}`,
      name: 'Operations Manager',
      phoneMasked: '+91 94220 *****',
      phoneRaw: '9422012345',
      role: 'OUTLET_MANAGER',
      pin: '2222',
      assignedOutlets: [active.merchantName],
      status: 'ACTIVE',
      lastActiveAt: '10 mins ago'
    };

    this.staffList.set([ownerStaff, managerStaff]);
    this.activeStaffOnDevice.set(ownerStaff);
  }

  readonly totalActiveStaff = computed(() => {
    return this.staffList().filter(s => s.status === 'ACTIVE').length;
  });

  switchStaffViaPin(pin: string): boolean {
    this.pinError.set(null);
    const match = this.staffList().find(s => s.pin === pin && s.status === 'ACTIVE');
    if (match) {
      this.activeStaffOnDevice.set(match);
      return true;
    }
    this.pinError.set('Incorrect Staff PIN');
    return false;
  }

  addStaffMember(draft: { name: string; phoneRaw: string; role: MerchantStaffRole; pin: string; assignedOutlets: string[] }): void {
    const newStaff: StaffMemberViewModel = {
      id: `staff-${Date.now()}`,
      name: draft.name,
      phoneRaw: draft.phoneRaw,
      phoneMasked: `+91 ${draft.phoneRaw.slice(0, 5)} *****`,
      role: draft.role,
      pin: draft.pin,
      assignedOutlets: draft.assignedOutlets,
      status: 'ACTIVE',
      lastActiveAt: 'Never'
    };

    this.staffList.update(list => [...list, newStaff]);
  }

  toggleStaffStatus(id: string): void {
    this.staffList.update(list =>
      list.map(s => {
        if (s.id !== id || s.role === 'OWNER') return s;
        return {
          ...s,
          status: s.status === 'ACTIVE' ? ('SUSPENDED' as StaffStatus) : ('ACTIVE' as StaffStatus)
        };
      })
    );
  }
}
