import { Injectable, signal, computed } from '@angular/core';
import { PreorderViewModel, PreorderStatus } from '../models/preorders-view.model';

@Injectable()
export class PreordersStore {
  readonly preorders = signal<PreorderViewModel[]>([]);
  readonly filterDate = signal<string>('ALL');
  readonly filterStatus = signal<string>('ALL');

  readonly filteredPreorders = computed(() => {
    let list = this.preorders();
    const d = this.filterDate();
    const s = this.filterStatus();

    const todayStr = new Date().toISOString().split('T')[0];
    if (d === 'TODAY') {
      list = list.filter(p => p.scheduledFulfillmentDate === todayStr);
    }

    if (s !== 'ALL') {
      list = list.filter(p => p.status === s);
    }

    return list;
  });

  readonly totalConfirmedCount = computed(() => {
    return this.preorders().filter(p => p.status === 'CONFIRMED').length;
  });

  readonly totalAdvancePaise = computed(() => {
    return this.preorders()
      .filter(p => p.isPaid)
      .reduce((sum, p) => sum + p.totalAmountPaise, 0);
  });

  setDateFilter(d: string): void {
    this.filterDate.set(d);
  }

  setStatusFilter(s: string): void {
    this.filterStatus.set(s);
  }

  updatePreorderStatus(orderId: string, status: PreorderStatus): void {
    this.preorders.update(list =>
      list.map(p => (p.orderId === orderId ? { ...p, status } : p))
    );
  }
}
