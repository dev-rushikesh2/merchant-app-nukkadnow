import { Injectable, signal, inject } from '@angular/core';
import { GstInvoice, SettlementPayout } from '../models/billing-view.model';
import { exportToCsv } from '../../analytics/utils/csv-exporter';
import { MerchantAuthStore } from '../../../core/auth/merchant-auth.store';

@Injectable()
export class BillingStore {
  private authStore = inject(MerchantAuthStore);

  readonly invoices = signal<GstInvoice[]>([]);
  readonly settlements = signal<SettlementPayout[]>([]);
  readonly merchantGstin = signal<string>('27AADCS5432K1Z9');

  constructor() {
    this.init();
  }

  private init(): void {
    this.loadBilling();
    this.authStore.tenantSwitched$.subscribe(() => {
      this.loadBilling();
    });
  }

  loadBilling(): void {
    const active = this.authStore.activeMerchant();
    const gstinMap: Record<string, string> = {
      'merchant-sabji-001': '27AABCP9821M1Z5',
      'merchant-kirana-002': '27AADCS5432K1Z9',
      'merchant-garguti-003': '27AGNPK8831A1Z2',
      'merchant-sweets-004': '27AAECM6641J1Z8'
    };
    this.merchantGstin.set(gstinMap[active.tenantId] || '27AADCS5432K1Z9');

    // Generate real tenant billing ledger
    this.invoices.set([
      {
        invoiceNumber: `NNK-INV-2026-10-${active.tenantId.slice(-3)}`,
        period: 'October 2026',
        invoiceDate: '2026-11-01',
        merchantGstin: this.merchantGstin(),
        platformHsn: '998314',
        subtotalPaise: 99900,
        cgstPaise: 8991,
        sgstPaise: 8991,
        totalPaise: 117882,
        paymentStatus: 'PAID'
      }
    ]);

    this.settlements.set([
      {
        utrNumber: `AXIS${Date.now().toString().slice(-8)}`,
        settlementDate: '2026-11-16',
        orderCount: 18,
        grossOrdersPaise: 640000,
        platformFeeDeductedPaise: 12800,
        netCreditedPaise: 627200,
        bankAccountMasked: 'Bank of India ••••••2201',
        status: 'SETTLED'
      }
    ]);
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
