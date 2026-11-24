import { Injectable, signal, computed, inject } from '@angular/core';
import { PickupSlotViewModel, DateCapacitySummary, PickupSlotStatus } from '../models/pickup-slots-view.model';
import { PickupSlotsApi } from '../data-access/pickup-slots.api';

/**
 * PickupSlotsStore -- real data only.
 * Fetches slots from the backend via PickupSlotsApi.
 * No hardcoded DEFAULT_SLOTS.
 */
@Injectable()
export class PickupSlotsStore {
  private readonly api = inject(PickupSlotsApi);

  readonly selectedDate = signal<string>(new Date().toISOString().split('T')[0]);
  readonly slots = signal<PickupSlotViewModel[]>([]);
  readonly filterStatus = signal<string>('ALL');
  readonly isLoading = signal<boolean>(false);

  readonly summary = computed<DateCapacitySummary>(() => {
    const list = this.slots();
    const totalSlots = list.length;
    const blockedSlots = list.filter(s => s.isBlocked).length;
    const fullSlots = list.filter(s => !s.isBlocked && s.bookedCount >= s.maxCapacity).length;
    const availableSlots = list.filter(s => !s.isBlocked && s.bookedCount < s.maxCapacity).length;
    const totalOrdersBooked = list.reduce((acc, s) => acc + s.bookedCount, 0);
    const totalCapacity = list.reduce((acc, s) => acc + s.maxCapacity, 0);
    const utilizationRate = totalCapacity > 0 ? Math.round((totalOrdersBooked / totalCapacity) * 100) : 0;

    return {
      date: this.selectedDate(),
      displayLabel: 'Active Slots',
      totalSlots,
      availableSlots,
      fullSlots,
      blockedSlots,
      totalOrdersBooked,
      totalCapacity,
      utilizationRate
    };
  });

  readonly filteredSlots = computed(() => {
    const list = this.slots();
    const filter = this.filterStatus();
    if (filter === 'AVAILABLE') return list.filter(s => !s.isBlocked && s.bookedCount < s.maxCapacity);
    if (filter === 'FULL') return list.filter(s => !s.isBlocked && s.bookedCount >= s.maxCapacity);
    if (filter === 'BLOCKED') return list.filter(s => s.isBlocked);
    return list;
  });

  constructor() {
    this.loadSlots();
  }

  loadSlots(): void {
    this.isLoading.set(true);
    this.api.fetchSlots(this.selectedDate()).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res?.data || res?.slots || []);
        this.slots.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.slots.set([]);
        this.isLoading.set(false);
      }
    });
  }

  selectDate(dateStr: string): void {
    this.selectedDate.set(dateStr);
    this.loadSlots();
  }

  setFilter(filter: string): void {
    this.filterStatus.set(filter);
  }

  toggleSlotBlocked(slotId: string): void {
    const slot = this.slots().find(s => s.id === slotId);
    if (!slot) return;
    const newBlocked = !slot.isBlocked;

    // Optimistic update; persist to backend
    this.slots.update(list =>
      list.map(s => s.id !== slotId ? s : {
        ...s,
        isBlocked: newBlocked,
        status: this.deriveStatus({ ...s, isBlocked: newBlocked })
      })
    );

    this.api.updateSlot(slotId, { isBlocked: newBlocked }).subscribe({
      error: () => {
        // Revert on failure
        this.slots.update(list =>
          list.map(s => s.id !== slotId ? s : { ...s, isBlocked: slot.isBlocked, status: slot.status })
        );
      }
    });
  }

  adjustCapacity(slotId: string, delta: number): void {
    const slot = this.slots().find(s => s.id === slotId);
    if (!slot) return;
    const newCap = Math.max(slot.bookedCount, slot.maxCapacity + delta);

    this.slots.update(list =>
      list.map(s => s.id !== slotId ? s : {
        ...s,
        maxCapacity: newCap,
        status: this.deriveStatus({ ...s, maxCapacity: newCap })
      })
    );

    this.api.updateSlot(slotId, { maxCapacity: newCap }).subscribe({
      error: () => {
        this.slots.update(list =>
          list.map(s => s.id !== slotId ? s : { ...s, maxCapacity: slot.maxCapacity, status: slot.status })
        );
      }
    });
  }

  blockAllRemaining(): void {
    this.slots.update(list =>
      list.map(slot => ({ ...slot, isBlocked: true, status: 'BLOCKED' as PickupSlotStatus }))
    );
  }

  unblockAll(): void {
    this.slots.update(list =>
      list.map(slot => ({
        ...slot,
        isBlocked: false,
        status: this.deriveStatus({ ...slot, isBlocked: false })
      }))
    );
  }

  private deriveStatus(s: PickupSlotViewModel): PickupSlotStatus {
    if (s.isBlocked) return 'BLOCKED';
    if (s.bookedCount >= s.maxCapacity) return 'FULL';
    if (s.bookedCount >= s.maxCapacity * 0.8) return 'ALMOST_FULL';
    return 'AVAILABLE';
  }
}
