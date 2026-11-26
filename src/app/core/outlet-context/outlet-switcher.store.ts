import { Injectable, signal, computed } from '@angular/core';

export type ShopLiveStatus = 'OPEN' | 'PAUSED' | 'CLOSED';

export interface OutletScheduleDay {
  day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface OutletRecord {
  id: string;
  name: string;
  locality: string;
  address: string;
  pincode: string;
  status: ShopLiveStatus;
  pauseRemainingMinutes?: number;
  activeOrdersCount: number;
  weeklySchedule: OutletScheduleDay[];
}

const DEFAULT_SCHEDULE: OutletScheduleDay[] = [
  { day: 'MON', isOpen: true, openTime: '09:00', closeTime: '21:00' },
  { day: 'TUE', isOpen: true, openTime: '09:00', closeTime: '21:00' },
  { day: 'WED', isOpen: true, openTime: '09:00', closeTime: '21:00' },
  { day: 'THU', isOpen: true, openTime: '09:00', closeTime: '21:00' },
  { day: 'FRI', isOpen: true, openTime: '09:00', closeTime: '21:00' },
  { day: 'SAT', isOpen: true, openTime: '09:00', closeTime: '22:00' },
  { day: 'SUN', isOpen: true, openTime: '09:00', closeTime: '22:00' }
];

@Injectable({ providedIn: 'root' })
export class OutletSwitcherStore {
  readonly outlets = signal<OutletRecord[]>([]);

  readonly activeOutletId = signal<string>('');

  readonly activeOutlet = computed(() => {
    return this.outlets().find((o) => o.id === this.activeOutletId()) || this.outlets()[0];
  });

  readonly currentStatus = computed(() => this.activeOutlet() ? this.activeOutlet().status : 'OPEN');

  selectOutlet(id: string) {
    this.activeOutletId.set(id);
  }

  setOutletForMerchant(outletId: string, name: string, locality: string, address: string) {
    const existing = this.outlets().find(o => o.id === outletId);
    if (!existing) {
      const record: OutletRecord = {
        id: outletId,
        name,
        locality,
        address,
        pincode: '440010',
        status: 'OPEN',
        activeOrdersCount: 0,
        weeklySchedule: DEFAULT_SCHEDULE
      };
      this.outlets.set([record]);
    }
    this.activeOutletId.set(outletId);
  }

  toggleStatus() {
    const next: Record<ShopLiveStatus, ShopLiveStatus> = {
      OPEN: 'PAUSED',
      PAUSED: 'CLOSED',
      CLOSED: 'OPEN'
    };
    this.setShopStatus(next[this.currentStatus()]);
  }

  setShopStatus(status: ShopLiveStatus, pauseMinutes?: number) {
    this.outlets.update((list) =>
      list.map((o) => {
        if (o.id === this.activeOutletId()) {
          return {
            ...o,
            status,
            pauseRemainingMinutes: status === 'PAUSED' ? (pauseMinutes || 45) : undefined
          };
        }
        return o;
      })
    );
  }

  updateSchedule(outletId: string, schedule: OutletScheduleDay[]) {
    this.outlets.update((list) =>
      list.map((o) => (o.id === outletId ? { ...o, weeklySchedule: schedule } : o))
    );
  }
}
