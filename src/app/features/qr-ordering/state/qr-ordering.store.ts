import { Injectable, signal, computed, inject } from '@angular/core';
import { QrStandeeViewModel, QrStandeeType } from '../models/qr-ordering-view.model';
import { generateQrSvg } from '../utils/qr-svg-generator';
import { MerchantAuthStore } from '../../../core/auth/merchant-auth.store';

@Injectable()
export class QrOrderingStore {
  private authStore = inject(MerchantAuthStore);

  readonly standees = signal<QrStandeeViewModel[]>([]);
  readonly merchantName = signal<string>('');
  readonly locality = signal<string>('');
  readonly merchantSlug = signal<string>('');
  readonly selectedForPrint = signal<QrStandeeViewModel | null>(null);

  constructor() {
    this.init();
  }

  private init(): void {
    this.regenerateForTenant();
    this.authStore.tenantSwitched$.subscribe(() => {
      this.regenerateForTenant();
    });
  }

  private regenerateForTenant(): void {
    const active = this.authStore.activeMerchant();
    const slug = active.merchantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const baseUrl = `https://nukkadnow.in/m/${slug}`;

    this.merchantName.set(active.merchantName);
    this.locality.set(`${active.locality}, ${active.city}`);
    this.merchantSlug.set(slug);

    const standees: QrStandeeViewModel[] = [
      {
        id: `qr-${active.tenantId}-counter`,
        label: `${active.merchantName} Counter Standee`,
        type: 'COUNTER',
        sourceTag: 'counter_main',
        targetUrl: `${baseUrl}?source=counter_main`,
        qrSvgDataUri: generateQrSvg(`${baseUrl}?source=counter_main`),
        scanCount: 142,
        orderCount: 68,
        isActive: true,
        lastScannedAt: '12 mins ago'
      },
      {
        id: `qr-${active.tenantId}-window`,
        label: 'Storefront Window Poster',
        type: 'WINDOW',
        sourceTag: 'window_poster',
        targetUrl: `${baseUrl}?source=window_poster`,
        qrSvgDataUri: generateQrSvg(`${baseUrl}?source=window_poster`),
        scanCount: 64,
        orderCount: 22,
        isActive: true,
        lastScannedAt: '1 hour ago'
      }
    ];

    this.standees.set(standees);
  }

  readonly totalScans = computed(() => {
    return this.standees().reduce((sum, s) => sum + s.scanCount, 0);
  });

  readonly totalQrOrders = computed(() => {
    return this.standees().reduce((sum, s) => sum + s.orderCount, 0);
  });

  readonly tableStandees = computed(() => {
    return this.standees().filter(s => s.type === 'TABLE');
  });

  readonly counterStandees = computed(() => {
    return this.standees().filter(s => s.type !== 'TABLE');
  });

  addStandee(label: string, type: QrStandeeType, tableNum?: number): void {
    const baseUrl = `https://nukkadnow.in/m/${this.merchantSlug()}`;
    const sourceTag = type === 'TABLE' ? `table_${tableNum}` : `${type.toLowerCase()}_${Date.now() % 1000}`;
    const targetUrl = `${baseUrl}?source=${sourceTag}`;
    const newStandee: QrStandeeViewModel = {
      id: `qr-${Date.now()}`,
      label,
      type,
      tableNumber: tableNum,
      sourceTag,
      targetUrl,
      qrSvgDataUri: generateQrSvg(targetUrl),
      scanCount: 0,
      orderCount: 0,
      isActive: true
    };
    this.standees.update(list => [...list, newStandee]);
  }

  addTableBatch(start: number, end: number): void {
    const baseUrl = `https://nukkadnow.in/m/${this.merchantSlug()}`;
    const newItems: QrStandeeViewModel[] = [];
    for (let i = start; i <= end; i++) {
      const sourceTag = `table_${i}`;
      const targetUrl = `${baseUrl}?source=${sourceTag}`;
      newItems.push({
        id: `qr-table-${i}-${Date.now()}`,
        label: `Table #${i} Tent Card`,
        type: 'TABLE',
        tableNumber: i,
        sourceTag,
        targetUrl,
        qrSvgDataUri: generateQrSvg(targetUrl),
        scanCount: 0,
        orderCount: 0,
        isActive: true
      });
    }
    this.standees.update(list => [...list, ...newItems]);
  }

  toggleActive(id: string): void {
    this.standees.update(list =>
      list.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s)
    );
  }

  deleteStandee(id: string): void {
    this.standees.update(list => list.filter(s => s.id !== id));
  }

  setPrintModal(standee: QrStandeeViewModel | null): void {
    this.selectedForPrint.set(standee);
  }
}
