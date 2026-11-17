import { Injectable, signal } from '@angular/core';
import { DeliverySettingsConfig, ActiveDeliveryOrder } from '../models/delivery-settings-view.model';

const DEFAULT_CONFIG: DeliverySettingsConfig = {
  enabled: true,
  zoneType: 'RADIUS',
  radiusKm: 5.0,
  whitelistedPincodes: ['440010', '440012', '440015', '440022'],
  minOrderAmountPaise: 15000,
  baseDeliveryFeePaise: 3000,
  freeDeliveryThresholdPaise: 40000,
  estimatedDeliveryMinutes: 30,
  maxDailyDeliveries: 50,
  driverNotes: 'Store delivery partner available for neighbourhood deliveries.'
};

@Injectable()
export class DeliverySettingsStore {
  readonly config = signal<DeliverySettingsConfig>({ ...DEFAULT_CONFIG });
  readonly activeDeliveries = signal<ActiveDeliveryOrder[]>([]);
  readonly dirty = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly saveSuccess = signal<boolean>(false);

  toggleDelivery(): void {
    this.config.update(c => ({ ...c, enabled: !c.enabled }));
    this.dirty.set(true);
  }

  setZoneType(zoneType: 'RADIUS' | 'PINCODES'): void {
    this.config.update(c => ({ ...c, zoneType }));
    this.dirty.set(true);
  }

  setRadiusKm(radiusKm: number): void {
    this.config.update(c => ({ ...c, radiusKm }));
    this.dirty.set(true);
  }

  addPincode(pincode: string): void {
    const clean = pincode.trim();
    if (!clean || this.config().whitelistedPincodes.includes(clean)) return;
    this.config.update(c => ({
      ...c,
      whitelistedPincodes: [...c.whitelistedPincodes, clean]
    }));
    this.dirty.set(true);
  }

  removePincode(pincode: string): void {
    this.config.update(c => ({
      ...c,
      whitelistedPincodes: c.whitelistedPincodes.filter(p => p !== pincode)
    }));
    this.dirty.set(true);
  }

  updatePricing(fields: { minOrderAmountPaise?: number; baseDeliveryFeePaise?: number; freeDeliveryThresholdPaise?: number }): void {
    this.config.update(c => ({ ...c, ...fields }));
    this.dirty.set(true);
  }

  updateEstimatedMinutes(estimatedDeliveryMinutes: number): void {
    this.config.update(c => ({ ...c, estimatedDeliveryMinutes }));
    this.dirty.set(true);
  }

  saveSettings(): void {
    this.isSaving.set(true);
    setTimeout(() => {
      this.isSaving.set(false);
      this.dirty.set(false);
      this.saveSuccess.set(true);
      setTimeout(() => this.saveSuccess.set(false), 3000);
    }, 600);
  }
}
