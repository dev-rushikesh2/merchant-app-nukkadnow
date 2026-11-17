import { Injectable, signal, computed, inject } from '@angular/core';
import { AnalyticsSummary, HourlyRushPoint, TopSellingProduct, AnalyticsTimeRange } from '../models/analytics-view.model';
import { exportToCsv } from '../utils/csv-exporter';
import { MerchantAuthStore } from '../../../core/auth/merchant-auth.store';
import { OrderInboxApi } from '../../order-inbox/data-access/order-inbox.api';

const SUMMARIES: Record<AnalyticsTimeRange, AnalyticsSummary> = {
  TODAY: {
    timeRange: 'TODAY',
    totalOrders: 48,
    completedOrders: 46,
    cancelledOrRejected: 2,
    grossOrderValuePaise: 1485000,
    netReconciledPayoutPaise: 1455300,
    platformFeePaise: 29700,
    averagePrepTimeMinutes: 17,
    onTimePickupRate: 97.2,
    totalCustomers: 41,
    walkinPct: 42,
    onlinePct: 58
  },
  YESTERDAY: {
    timeRange: 'YESTERDAY',
    totalOrders: 56,
    completedOrders: 54,
    cancelledOrRejected: 2,
    grossOrderValuePaise: 1840000,
    netReconciledPayoutPaise: 1803200,
    platformFeePaise: 36800,
    averagePrepTimeMinutes: 19,
    onTimePickupRate: 95.8,
    totalCustomers: 49,
    walkinPct: 45,
    onlinePct: 55
  },
  WEEK: {
    timeRange: 'WEEK',
    totalOrders: 342,
    completedOrders: 334,
    cancelledOrRejected: 8,
    grossOrderValuePaise: 11260000,
    netReconciledPayoutPaise: 11034800,
    platformFeePaise: 225200,
    averagePrepTimeMinutes: 18,
    onTimePickupRate: 96.4,
    totalCustomers: 286,
    walkinPct: 40,
    onlinePct: 60
  },
  MONTH: {
    timeRange: 'MONTH',
    totalOrders: 1480,
    completedOrders: 1445,
    cancelledOrRejected: 35,
    grossOrderValuePaise: 48600000,
    netReconciledPayoutPaise: 47628000,
    platformFeePaise: 972000,
    averagePrepTimeMinutes: 18,
    onTimePickupRate: 96.9,
    totalCustomers: 910,
    walkinPct: 38,
    onlinePct: 62
  }
};

const HOURLY_RUSH: HourlyRushPoint[] = [
  { hourLabel: '08:00', ordersCount: 4, intensityPct: 30, isPeak: false },
  { hourLabel: '09:00', ordersCount: 11, intensityPct: 75, isPeak: false },
  { hourLabel: '10:00', ordersCount: 9, intensityPct: 60, isPeak: false },
  { hourLabel: '11:00', ordersCount: 5, intensityPct: 35, isPeak: false },
  { hourLabel: '12:00', ordersCount: 6, intensityPct: 40, isPeak: false },
  { hourLabel: '13:00', ordersCount: 4, intensityPct: 25, isPeak: false },
  { hourLabel: '14:00', ordersCount: 2, intensityPct: 15, isPeak: false },
  { hourLabel: '15:00', ordersCount: 3, intensityPct: 20, isPeak: false },
  { hourLabel: '16:00', ordersCount: 7, intensityPct: 50, isPeak: false },
  { hourLabel: '17:00', ordersCount: 14, intensityPct: 95, isPeak: true },
  { hourLabel: '18:00', ordersCount: 15, intensityPct: 100, isPeak: true },
  { hourLabel: '19:00', ordersCount: 12, intensityPct: 80, isPeak: true },
  { hourLabel: '20:00', ordersCount: 8, intensityPct: 55, isPeak: false },
  { hourLabel: '21:00', ordersCount: 4, intensityPct: 30, isPeak: false }
];

const TOP_PRODUCTS: TopSellingProduct[] = [
  { id: 'p1', name: 'Farm Fresh Produce Bundle', category: 'Vegetables', unitsSold: 142, revenuePaise: 568000, stockoutDurationMinutes: 0 },
  { id: 'p2', name: 'Daily Essentials & Groceries', category: 'Grocery', unitsSold: 184, revenuePaise: 552000, stockoutDurationMinutes: 15 },
  { id: 'p3', name: 'Nagpur Sweets & Bakery', category: 'Sweets', unitsSold: 68, revenuePaise: 3060000, stockoutDurationMinutes: 0 }
];

@Injectable()
export class AnalyticsStore {
  private authStore = inject(MerchantAuthStore);
  private orderApi = inject(OrderInboxApi);

  readonly selectedRange = signal<AnalyticsTimeRange>('TODAY');
  readonly summary = computed(() => SUMMARIES[this.selectedRange()]);
  readonly hourlyRush = signal<HourlyRushPoint[]>(HOURLY_RUSH);
  readonly topProducts = signal<TopSellingProduct[]>(TOP_PRODUCTS);
  readonly isExporting = signal<boolean>(false);

  setTimeRange(range: AnalyticsTimeRange): void {
    this.selectedRange.set(range);
  }

  exportReport(): void {
    this.isExporting.set(true);
    const active = this.authStore.activeMerchant();

    this.orderApi.fetchOrders().subscribe({
      next: (res) => {
        const headers = ['Order ID', 'Date & Time', 'Customer', 'Source', 'Items', 'Gross Amount (INR)', 'Platform Fee (INR)', 'Net Payout (INR)', 'Status'];
        const orders = res?.data || [];
        const rows = orders.map((o: any) => {
          const gross = o.amount || 0;
          const fee = (gross * 0.02).toFixed(2);
          const net = (gross * 0.98).toFixed(2);
          return [
            o.orderNumber || o.id,
            o.time || 'Today',
            o.customerName || 'Customer',
            'Marketplace PWA',
            (o.items || []).map((i: any) => `${i.quantity}x ${i.name}`).join('; ') || `${o.itemsCount || 1} items`,
            gross.toFixed(2),
            fee,
            net,
            o.status || 'COMPLETED'
          ];
        });

        const exportDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
        exportToCsv(`${active.tenantId}_reconciliation_report_${this.selectedRange().toLowerCase()}_${exportDate}.csv`, headers, rows);
        this.isExporting.set(false);
      },
      error: () => {
        this.isExporting.set(false);
      }
    });
  }
}
