import { Injectable, signal, inject } from '@angular/core';
import { DashboardKpis, DashboardActivity } from '../models/dashboard-view.model';
import { DashboardApi } from '../data-access/dashboard.api';

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private api = inject(DashboardApi);

  readonly kpis = signal<DashboardKpis>({
    ordersToday: 0,
    pendingActionOrders: 0,
    inPrepOrders: 0,
    readyOrders: 0,
    todaysGrossSalesPaise: 0,
    todaysNetPayoutPaise: 0,
    lowStockCount: 0,
    nextSlotBookedCount: 0,
    nextSlotCapacity: 0,
    nextSlotTime: ''
  });
  readonly activities = signal<DashboardActivity[]>([]);
  readonly loading = signal<boolean>(false);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.fetchDashboardSummary().subscribe({
      next: (data) => {
        if (data) {
          this.kpis.set({
            ordersToday: data.performance.orders,
            pendingActionOrders: data.activeOrdersCount,
            inPrepOrders: data.activeOrdersCount,
            readyOrders: data.pendingPickupCount,
            todaysGrossSalesPaise: data.todayRevenuePaise,
            todaysNetPayoutPaise: Math.round(data.todayRevenuePaise * 0.98),
            lowStockCount: 0,
            nextSlotBookedCount: data.pendingPickupCount,
            nextSlotCapacity: 20,
            nextSlotTime: 'Active Daily Slot'
          });
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
