import { Injectable, signal, computed } from '@angular/core';
import { PickupSlotViewModel, DateCapacitySummary, PickupSlotStatus } from '../models/pickup-slots-view.model';

const todayDate = new Date().toISOString().split('T')[0];
const DEFAULT_SLOTS: PickupSlotViewModel[] = [
  { id: 'slot-1', date: todayDate, startTime: '09:00 AM', endTime: '10:00 AM', bookedCount: 3, maxCapacity: 10, isBlocked: false, status: 'AVAILABLE', activeOrderIds: ['#ORD78289'] },
  { id: 'slot-2', date: todayDate, startTime: '10:00 AM', endTime: '11:00 AM', bookedCount: 8, maxCapacity: 10, isBlocked: false, status: 'ALMOST_FULL', activeOrderIds: ['#ORD78290', '#ORD78291'] },
  { id: 'slot-3', date: todayDate, startTime: '11:00 AM', endTime: '12:00 PM', bookedCount: 4, maxCapacity: 10, isBlocked: false, status: 'AVAILABLE', activeOrderIds: [] },
  { id: 'slot-4', date: todayDate, startTime: '12:00 PM', endTime: '01:00 PM', bookedCount: 2, maxCapacity: 10, isBlocked: false, status: 'AVAILABLE', activeOrderIds: [] },
  { id: 'slot-5', date: todayDate, startTime: '01:00 PM', endTime: '02:00 PM', bookedCount: 0, maxCapacity: 10, isBlocked: true, status: 'BLOCKED', activeOrderIds: [] },
  { id: 'slot-6', date: todayDate, startTime: '04:00 PM', endTime: '05:00 PM', bookedCount: 5, maxCapacity: 12, isBlocked: false, status: 'AVAILABLE', activeOrderIds: [] },
  { id: 'slot-7', date: todayDate, startTime: '05:00 PM', endTime: '06:00 PM', bookedCount: 12, maxCapacity: 12, isBlocked: false, status: 'FULL', activeOrderIds: [] },
  { id: 'slot-8', date: todayDate, startTime: '06:00 PM', endTime: '07:00 PM', bookedCount: 9, maxCapacity: 15, isBlocked: false, status: 'ALMOST_FULL', activeOrderIds: [] },
  { id: 'slot-9', date: todayDate, startTime: '07:00 PM', endTime: '08:00 PM', bookedCount: 6, maxCapacity: 15, isBlocked: false, status: 'AVAILABLE', activeOrderIds: [] },
  { id: 'slot-10', date: todayDate, startTime: '08:00 PM', endTime: '09:00 PM', bookedCount: 1, maxCapacity: 10, isBlocked: false, status: 'AVAILABLE', activeOrderIds: [] }
];

@Injectable()
export class PickupSlotsStore {
  readonly selectedDate = signal<string>(new Date().toISOString().split('T')[0]);
  readonly slots = signal<PickupSlotViewModel[]>([...DEFAULT_SLOTS]);
  readonly filterStatus = signal<string>('ALL');

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
    if (filter === 'AVAILABLE') {
      return list.filter(s => !s.isBlocked && s.bookedCount < s.maxCapacity);
    }
    if (filter === 'FULL') {
      return list.filter(s => !s.isBlocked && s.bookedCount >= s.maxCapacity);
    }
    if (filter === 'BLOCKED') {
      return list.filter(s => s.isBlocked);
    }
    return list;
  });

  selectDate(dateStr: string): void {
    this.selectedDate.set(dateStr);
  }

  setFilter(filter: string): void {
    this.filterStatus.set(filter);
  }

  toggleSlotBlocked(slotId: string): void {
    this.slots.update(list =>
      list.map(slot => {
        if (slot.id !== slotId) return slot;
        const newBlocked = !slot.isBlocked;
        let newStatus: PickupSlotStatus = 'AVAILABLE';
        if (newBlocked) {
          newStatus = 'BLOCKED';
        } else if (slot.bookedCount >= slot.maxCapacity) {
          newStatus = 'FULL';
        } else if (slot.bookedCount >= slot.maxCapacity * 0.8) {
          newStatus = 'ALMOST_FULL';
        }
        return {
          ...slot,
          isBlocked: newBlocked,
          status: newStatus
        };
      })
    );
  }

  adjustCapacity(slotId: string, delta: number): void {
    this.slots.update(list =>
      list.map(slot => {
        if (slot.id !== slotId) return slot;
        const newCap = Math.max(slot.bookedCount, slot.maxCapacity + delta);
        let newStatus: PickupSlotStatus = slot.isBlocked ? 'BLOCKED' : 'AVAILABLE';
        if (!slot.isBlocked) {
          if (slot.bookedCount >= newCap) {
            newStatus = 'FULL';
          } else if (slot.bookedCount >= newCap * 0.8) {
            newStatus = 'ALMOST_FULL';
          }
        }
        return {
          ...slot,
          maxCapacity: newCap,
          status: newStatus
        };
      })
    );
  }

  blockAllRemaining(): void {
    this.slots.update(list =>
      list.map(slot => ({
        ...slot,
        isBlocked: true,
        status: 'BLOCKED'
      }))
    );
  }

  unblockAll(): void {
    this.slots.update(list =>
      list.map(slot => {
        let status: PickupSlotStatus = 'AVAILABLE';
        if (slot.bookedCount >= slot.maxCapacity) {
          status = 'FULL';
        } else if (slot.bookedCount >= slot.maxCapacity * 0.8) {
          status = 'ALMOST_FULL';
        }
        return {
          ...slot,
          isBlocked: false,
          status
        };
      })
    );
  }
}
