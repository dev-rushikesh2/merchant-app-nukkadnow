import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CapacitySettingsApi } from '../data-access/capacity-settings.api';

export interface PickupSlotPreview {
  id: string;
  timeRange: string;
  bookedCount: number;
  capacity: number;
  status: 'Open' | 'Filling Fast' | 'Full' | 'Paused';
}

export interface BlackoutTimeWindow {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  days: string[];
  isActive: boolean;
}

@Component({
  selector: 'merchant-capacity-settings-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './capacity-settings-list.page.html',
  styleUrls: ['./capacity-settings-list.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CapacitySettingsListPageComponent implements OnInit {
  private readonly capacityApi = inject(CapacitySettingsApi);
  readonly Math = Math;
  // Sub-tabs: 'SLOTS' | 'BLACKOUTS'
  readonly activeSubTab = signal<'SLOTS' | 'BLACKOUTS'>('SLOTS');

  // Capacity Settings Signals
  readonly slotInterval = signal<15 | 30 | 45 | 60>(30);
  readonly maxOrdersPerSlot = signal<number>(12);
  readonly maxConcurrentActive = signal<number>(8);
  readonly bufferMinutes = signal<number>(15);
  readonly kitchenLeadTime = signal<number>(20);

  // Blackout Windows (configurable per store)
  readonly blackoutWindows = signal<BlackoutTimeWindow[]>([]);

  // Paused slots
  readonly pausedSlotIds = signal<Set<string>>(new Set());

  // Dynamic slots generated from store operating schedule
  readonly todaySlots = computed<PickupSlotPreview[]>(() => {
    const interval = this.slotInterval();
    const slots: PickupSlotPreview[] = [];
    const paused = this.pausedSlotIds();

    for (let hour = 9; hour < 21; hour++) {
      for (let min = 0; min < 60; min += interval) {
        const startH = hour > 12 ? hour - 12 : hour;
        const startAmPm = hour >= 12 ? 'PM' : 'AM';
        const nextMin = min + interval;
        const nextHour = nextMin >= 60 ? hour + 1 : hour;
        const finalMin = nextMin % 60;
        const endH = nextHour > 12 ? nextHour - 12 : nextHour;
        const endAmPm = nextHour >= 12 ? 'PM' : 'AM';

        const sMin = min < 10 ? '0' + min : String(min);
        const fMin = finalMin < 10 ? '0' + finalMin : String(finalMin);
        const timeRange = `${startH}:${sMin} ${startAmPm} – ${endH}:${fMin} ${endAmPm}`;
        const slotId = `slot-${hour}-${min}`;
        const isPaused = paused.has(slotId);

        slots.push({
          id: slotId,
          timeRange,
          bookedCount: 0,
          capacity: this.maxOrdersPerSlot(),
          status: isPaused ? 'Paused' : 'Open'
        });
      }
    }
    return slots;
  });

  // Modal
  readonly showAddBlackoutModal = signal<boolean>(false);
  readonly newBlackoutName = signal<string>('');
  readonly newBlackoutStart = signal<string>('14:00');
  readonly newBlackoutEnd = signal<string>('15:30');

  // Toast
  readonly toast = signal<string | null>(null);

  ngOnInit(): void {
    this.capacityApi.fetchSettings().subscribe((data) => {
      if (!data) return;
      if (data.slotInterval) this.slotInterval.set(data.slotInterval);
      if (data.maxOrdersPerSlot !== undefined) this.maxOrdersPerSlot.set(Number(data.maxOrdersPerSlot));
      if (data.maxConcurrentActive !== undefined) this.maxConcurrentActive.set(Number(data.maxConcurrentActive));
      if (data.bufferMinutes !== undefined) this.bufferMinutes.set(Number(data.bufferMinutes));
      if (data.kitchenLeadTime !== undefined) this.kitchenLeadTime.set(Number(data.kitchenLeadTime));
      if (Array.isArray(data.blackoutWindows)) this.blackoutWindows.set(data.blackoutWindows);
      if (Array.isArray(data.pausedSlotIds)) this.pausedSlotIds.set(new Set(data.pausedSlotIds));
    });
  }

  setInterval(val: 15 | 30 | 45 | 60) {
    this.slotInterval.set(val);
    this.showToast(`Pickup slot interval set to ${val} minutes.`);
  }

  toggleSlotPause(slotId: string) {
    this.pausedSlotIds.update(set => {
      const next = new Set(set);
      if (next.has(slotId)) next.delete(slotId);
      else next.add(slotId);
      return next;
    });
    this.showToast('Slot status updated.');
  }

  toggleBlackout(id: string) {
    this.blackoutWindows.update(list =>
      list.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b)
    );
  }

  addBlackout() {
    const name = this.newBlackoutName().trim();
    if (!name) return;

    const newWindow: BlackoutTimeWindow = {
      id: `bw-${Date.now()}`,
      name,
      startTime: this.newBlackoutStart(),
      endTime: this.newBlackoutEnd(),
      days: ['All Days'],
      isActive: true
    };

    this.blackoutWindows.update(list => [...list, newWindow]);
    this.showAddBlackoutModal.set(false);
    this.newBlackoutName.set('');
    this.showToast(`Blackout window "${name}" configured!`);
  }

  saveSettings() {
    this.capacityApi.saveSettings({
      slotInterval: this.slotInterval(),
      maxOrdersPerSlot: this.maxOrdersPerSlot(),
      maxConcurrentActive: this.maxConcurrentActive(),
      bufferMinutes: this.bufferMinutes(),
      kitchenLeadTime: this.kitchenLeadTime(),
      blackoutWindows: this.blackoutWindows(),
      pausedSlotIds: Array.from(this.pausedSlotIds()),
    }).subscribe({
      next: () => {
        this.showToast('Kitchen capacity & slot settings saved successfully!');
      },
      error: () => {
        this.showToast('Failed to save capacity settings. Please retry.');
      }
    });
  }

  private showToast(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(null), 2800);
  }
}
