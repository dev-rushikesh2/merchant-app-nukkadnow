import { Injectable, signal, computed, inject } from '@angular/core';
import { AnalyticsSummary, HourlyRushPoint, TopSellingProduct, AnalyticsTimeRange } from '../models/analytics-view.model';
import { exportToCsv } from '../utils/csv-exporter';
import { MerchantAuthStore } from '../../../core/auth/merchant-auth.store';
import { OrderInboxApi } from '../../order-inbox/data-access/order-inbox.api';
import { AnalyticsApi } from '../data-access/analytics.api';

/**
 * AnalyticsStore -- real data only.
 * Fetches analytics from the backend via AnalyticsApi (which calls the merchant BFF).
 * Falls back to empty/zero state on error; never shows hardcoded numbers.
 */
@Injectable()
export class AnalyticsStore {
  private authStore = inject(MerchantAuthStore);
  private orderApi = inject(OrderInboxApi);
  private analyticsApi = inject(AnalyticsApi);

  readonly selectedRange = signal<AnalyticsTimeRange>('TODAY');
  readonly isLoading = signal<boolean>(false);

  readonly summary = signal<AnalyticsSummary | null>(null);
  readonly hourlyRush = signal<HourlyRushPoint[]>([]);
  readonly topProducts = signal<TopSellingProduct[]>([]);
  readonly isExporting = signal<boolean>(false);

  constructor() {
    this.loadSummary();
    this.authStore.tenantSwitched$.subscribe(() => {
      this.loadSummary();
    });
  }

  setTimeRange(range: AnalyticsTimeRange): void {
    this.selectedRange.set(range);
    this.loadSummary();
  }

  loadSummary(): void {
    this.isLoading.set(true);
    const range = this.selectedRange();

    this.analyticsApi.fetchSummary(range).subscribe({
      next: (res: any) => {
        if (res?.summary) {
          this.summary.set(res.summary);
        } else if (res?.data) {
          this.summary.set(res.data);
        } else {
          this.summary.set(null);
        }
        if (res?.hourlyRush) {
          this.hourlyRush.set(res.hourlyRush);
        }
        if (res?.topProducts) {
          this.topProducts.set(res.topProducts);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.summary.set(null);
        this.hourlyRush.set([]);
        this.topProducts.set([]);
        this.isLoading.set(false);
      }
    });
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
            o.time || '',
            o.customerName || '',
            o.fulfilmentType || 'Marketplace',
            (o.items || []).map((i: any) => `${i.quantity}x ${i.name}`).join('; ') || `${o.itemsCount || 1} items`,
            gross.toFixed(2),
            fee,
            net,
            o.status || 'COMPLETED'
          ];
        });

        const exportDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const tenantId = active?.tenantId || 'merchant';
        exportToCsv(`${tenantId}_reconciliation_report_${this.selectedRange().toLowerCase()}_${exportDate}.csv`, headers, rows);
        this.isExporting.set(false);
      },
      error: () => {
        this.isExporting.set(false);
      }
    });
  }
}
