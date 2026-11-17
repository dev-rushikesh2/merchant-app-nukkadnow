import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

export interface StoreRider {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  status: 'Available' | 'On Delivery' | 'Off Shift';
  activeOrdersCount: number;
}

@Component({
  selector: 'merchant-delivery-settings-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './delivery-settings-list.page.html',
  styleUrls: ['./delivery-settings-list.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeliverySettingsListPageComponent {
  // Service toggle
  readonly isDeliveryEnabled = signal<boolean>(true);

  // Delivery configuration signals
  readonly deliveryRadiusKm = signal<number>(5.0);
  readonly minOrderAmount = signal<number>(149);
  readonly baseDeliveryFee = signal<number>(25);
  readonly freeDeliveryAbove = signal<number>(499);
  readonly estDeliveryMinutes = signal<number>(30);

  // Supported Pincodes
  readonly pincodes = signal<string[]>(['440010', '440012', '440015', '440022']);
  readonly newPincode = signal<string>('');

  // Store Riders Roster (zero hardcoded dummy riders)
  readonly riders = signal<StoreRider[]>([]);
  readonly showAddRider = signal<boolean>(false);
  readonly newRiderName = signal<string>('');
  readonly newRiderPhone = signal<string>('');
  readonly newRiderVehicle = signal<string>('');

  // Toast
  readonly toast = signal<string | null>(null);

  addRider() {
    const name = this.newRiderName().trim();
    const phone = this.newRiderPhone().trim();
    if (!name || !phone) return;

    const rider: StoreRider = {
      id: `rider-${Date.now()}`,
      name,
      phone,
      vehicle: this.newRiderVehicle().trim() || 'Two-Wheeler Delivery',
      status: 'Available',
      activeOrdersCount: 0
    };

    this.riders.update(list => [...list, rider]);
    this.newRiderName.set('');
    this.newRiderPhone.set('');
    this.newRiderVehicle.set('');
    this.showAddRider.set(false);
    this.showToast(`Delivery partner "${name}" registered successfully!`);
  }

  toggleDelivery() {
    this.isDeliveryEnabled.update(v => !v);
    this.showToast(`Delivery service is now ${this.isDeliveryEnabled() ? 'ENABLED' : 'DISABLED'}.`);
  }

  addPincode() {
    const pin = this.newPincode().trim();
    if (pin.length === 6 && !this.pincodes().includes(pin)) {
      this.pincodes.update(list => [...list, pin]);
      this.newPincode.set('');
      this.showToast(`Pincode ${pin} added to delivery zone.`);
    }
  }

  removePincode(pin: string) {
    this.pincodes.update(list => list.filter(p => p !== pin));
    this.showToast(`Pincode ${pin} removed.`);
  }

  toggleRiderStatus(riderId: string) {
    this.riders.update(list =>
      list.map(r => {
        if (r.id === riderId) {
          const nextStatus = r.status === 'Available' ? 'Off Shift' : 'Available';
          return { ...r, status: nextStatus };
        }
        return r;
      })
    );
  }

  saveSettings() {
    this.showToast('Delivery geofence and pricing rules saved successfully!');
  }

  private showToast(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(null), 2800);
  }
}
