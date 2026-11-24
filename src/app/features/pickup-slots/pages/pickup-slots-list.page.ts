import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PickupSlotsStore } from '../state/pickup-slots.store';
import { ButtonComponent } from '@nukkadnow/ui';

@Component({
  selector: 'merchant-pickup-slots-list-page',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './pickup-slots-list.page.html',
  styleUrls: ['./pickup-slots-list.page.scss'],
  providers: [PickupSlotsStore],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PickupSlotsListPageComponent {
  readonly store = inject(PickupSlotsStore);

  // Generate next 3 dates dynamically so labels are always current.
  readonly dates = (() => {
    const result = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 0; i < 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const val = d.toISOString().split('T')[0];
      const label = i === 0
        ? `Today (${d.getDate()} ${monthNames[d.getMonth()]})`
        : i === 1
        ? `Tomorrow (${d.getDate()} ${monthNames[d.getMonth()]})`
        : `${dayNames[d.getDay()]} (${d.getDate()} ${monthNames[d.getMonth()]})`;
      result.push({ label, value: val });
    }
    return result;
  })();

  selectDate(val: string): void {
    this.store.selectDate(val);
  }

  setFilter(filter: string): void {
    this.store.setFilter(filter);
  }

  toggleBlock(slotId: string): void {
    this.store.toggleSlotBlocked(slotId);
  }

  adjustCap(slotId: string, delta: number): void {
    this.store.adjustCapacity(slotId, delta);
  }

  getSlotStatusClass(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'status-available';
      case 'ALMOST_FULL': return 'status-almost-full';
      case 'FULL': return 'status-full';
      case 'BLOCKED': return 'status-blocked';
      default: return '';
    }
  }

  getSlotProgressWidth(booked: number, max: number): number {
    if (max <= 0) return 0;
    return Math.min(100, Math.round((booked / max) * 100));
  }
}
