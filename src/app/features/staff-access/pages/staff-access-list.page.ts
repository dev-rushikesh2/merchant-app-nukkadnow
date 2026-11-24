import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { MerchantAuthStore } from '../../../core/auth/merchant-auth.store';

export type StaffRole = 'OWNER' | 'MANAGER' | 'CASHIER' | 'CHEF';

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  role: StaffRole;
  pin: string;
  outlet: string;
  isActive: boolean;
  lastActive: string;
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
  private sub = new Subscription();

  // Active Staff using this terminal
  readonly activeStaff = signal<StaffMember>({
    id: '',
    name: '',
    phone: '',
    role: 'OWNER',
    pin: '1234',
    outlet: '',
    isActive: true,
    lastActive: 'Active Now'
  });

  // Staff Roster
  readonly staffList = signal<StaffMember[]>([]);

  // Masked PINs toggle state
  readonly revealedPins = signal<Record<string, boolean>>({});

  // Modals
  readonly showPinSwitchModal = signal<boolean>(false);
  readonly showInviteModal = signal<boolean>(false);

  // Keypad PIN input
  readonly enteredPin = signal<string>('');
  readonly pinError = signal<string | null>(null);

  // Invite Form
  readonly newName = signal<string>('');
  readonly newPhone = signal<string>('');
  readonly newRole = signal<StaffRole>('CASHIER');
  readonly newPin = signal<string>('');

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
    const owner: StaffMember = {
      id: m.id,
      name: m.fullName,
      phone: m.phoneNumber,
      role: 'OWNER',
      pin: '1234',
      outlet: m.merchantName,
      isActive: true,
      lastActive: 'Active Now'
    };

    this.activeStaff.set(owner);
    this.staffList.set([owner]);
  }

  togglePinReveal(id: string) {
    this.revealedPins.update(map => ({
      ...map,
      [id]: !map[id]
    }));
  }

  toggleStaffActive(id: string) {
    this.staffList.update(list =>
      list.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s)
    );
    this.showToast('Staff status updated.');
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
    const matched = this.staffList().find(s => s.pin === pin && s.isActive);
    if (matched) {
      this.activeStaff.set(matched);
      this.showPinSwitchModal.set(false);
      this.showToast(`Device switched to ${matched.name} (${matched.role})!`);
    } else {
      this.pinError.set('Invalid PIN. Please try again.');
      setTimeout(() => this.enteredPin.set(''), 800);
    }
  }

  inviteStaffMember() {
    const name = this.newName().trim();
    const phone = this.newPhone().trim();
    const pin = this.newPin().trim() || Math.floor(1000 + Math.random() * 9000).toString();

    if (!name || !phone) {
      this.showToast('Please enter name and phone number.');
      return;
    }

    const m = this.authStore.activeMerchant();
    const newStaff: StaffMember = {
      id: `staff-${Date.now()}`,
      name,
      phone,
      role: this.newRole(),
      pin,
      outlet: m.merchantName,
      isActive: true,
      lastActive: 'Just invited'
    };

    this.staffList.update(list => [...list, newStaff]);
    this.showInviteModal.set(false);
    this.newName.set('');
    this.newPhone.set('');
    this.newPin.set('');
    this.showToast(`Team member "${name}" invited successfully! PIN: ${pin}`);
  }

  removeStaff(id: string, name: string) {
    // In production: replace with a modal confirmation dialog
    this.staffList.update(list => list.filter(s => s.id !== id));
    this.showToast(`${name} removed from store roster.`);
  }

  private showToast(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(null), 2800);
  }
}
