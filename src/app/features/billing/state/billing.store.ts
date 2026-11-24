import { Injectable, signal, inject } from '@angular/core';
import { GstInvoice, SettlementPayout } from '../models/billing-view.model';
import { exportToCsv } from '../../analytics/utils/csv-exporter';
import { MerchantAuthStore } from '../../../core/auth/merchant-auth.store';
import { BillingApi } from '../data-access/billing.api';

/**
 * BillingStore -- real data only.
 * Fetches invoices and settlements from the backend BillingApi.
 * No hardcoded invoices or GSTIN values.
 */
@Injectable()
export class BillingStore {
  private authStore = inject(MerchantAuthStore);
  private billingApi = inject(BillingApi);

  readonly invoices = signal<GstInvoice[]>([]);
  readonly settlements = signal<SettlementPayout[]>([]);
  readonly merchantGstin = signal<string>('');
  readonly isLoading = signal<boolean>(false);

  constructor() {
    this.loadBilling();
    this.authStore.tenantSwitched$.subscribe(() => {
      this.loadBilling();
    });
  }

  loadBilling(): void {
    this.isLoading.set(true);
    this.billingApi.fetchBillingDetails().subscribe({
      next: (res: any) => {
        this.invoices.set(res?.invoices || []);
        this.settlements.set(res?.settlements || []);
        if (res?.merchantGstin) {
          this.merchantGstin.set(res.merchantGstin);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.invoices.set([]);
        this.settlements.set([]);
        this.isLoading.set(false);
      }
    });
  }

  downloadInvoicePdf(inv: GstInvoice): void {
    const headers = ['Invoice Number', 'Period', 'Date', 'Merchant GSTIN', 'HSN Code', 'Subtotal (INR)', 'CGST 9% (INR)', 'SGST 9% (INR)', 'Total (INR)', 'Status'];
    const row = [
      inv.invoiceNumber,
      inv.period,
      inv.invoiceDate,
      inv.merchantGstin,
      inv.platformHsn,
      (inv.subtotalPaise / 100).toFixed(2),
      (inv.cgstPaise / 100).toFixed(2),
      (inv.sgstPaise / 100).toFixed(2),
      (inv.totalPaise / 100).toFixed(2),
      inv.paymentStatus
    ];
    exportToCsv(`tax_invoice_${inv.invoiceNumber}.csv`, headers, [row]);
  }
}
