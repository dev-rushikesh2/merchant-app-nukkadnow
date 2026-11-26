import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClientAdapter } from '@nukkadnow/api-client';
import { MerchantAuthStore } from '../../../core/auth/merchant-auth.store';
import { OutletSwitcherStore } from '../../../core/outlet-context/outlet-switcher.store';
import { QrStandeeViewModel, QrStandeeType } from '../models/qr-ordering-view.model';
import { buildCustomerOrderUrl, generateMerchantQrSvg } from '../utils/qr-svg-generator';

@Injectable({ providedIn: 'root' })
export class QrOrderingStore {
  private http = inject(HttpClientAdapter);
  private authStore = inject(MerchantAuthStore);
  private outletStore = inject(OutletSwitcherStore);

  readonly standees = signal<QrStandeeViewModel[]>([]);
  readonly selectedForPrint = signal<QrStandeeViewModel | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);

  readonly merchantName = signal<string>('My NukkadNow Shop');
  readonly shopName = this.merchantName;
  readonly locality = signal<string>('');
  readonly city = signal<string>('');
  readonly outletId = signal<string>('');

  readonly merchantSlug = computed(() => {
    const active = this.authStore.activeMerchant();
    return this.outletId() || this.outletStore.activeOutletId() || active?.outletId || 'outlet-merchant-kirana-00';
  });

  readonly storefrontOrderUrl = computed(() =>
    buildCustomerOrderUrl(this.merchantSlug(), 'DIRECT_LINK')
  );

  readonly counterStandees = computed(() =>
    this.standees().filter(s => s.type !== 'TABLE')
  );

  readonly tableStandees = computed(() =>
    this.standees().filter(s => s.type === 'TABLE')
  );

  readonly activeCount = computed(() => this.standees().filter(s => s.isActive).length);
  readonly totalScans = computed(() => this.standees().reduce((sum, s) => sum + (s.scanCount || 0), 0));
  readonly totalQrOrders = computed(() => this.standees().reduce((sum, s) => sum + (s.orderCount || 0), 0));

  constructor() {
    this.loadStandees();
    this.authStore.tenantSwitched$.subscribe(() => {
      this.loadStandees();
    });
  }

  loadStandees(): void {
    const active = this.authStore.activeMerchant();
    if (active) {
      this.merchantName.set(active.merchantName || 'My NukkadNow Shop');
      this.locality.set(active.locality || '');
      this.city.set(active.city || '');
      if (active.outletId) {
        this.outletId.set(active.outletId);
      }
    }

    this.isLoading.set(true);
    this.http.get<any>('/api/v1/merchant/qr-standees').subscribe({
      next: (res: any) => {
        const data = res?.data || res;
        if (data?.shopName) this.merchantName.set(data.shopName);
        if (data?.locality) this.locality.set(data.locality);
        if (data?.city) this.city.set(data.city);
        if (data?.outletId) this.outletId.set(data.outletId);

        const resolvedOutletId = data?.outletId || this.merchantSlug();
        const serverStandees = Array.isArray(data?.standees) ? data.standees : [];

        if (serverStandees.length > 0) {
          this.standees.set(serverStandees.map((st: any) => this.hydrateStandee(st, resolvedOutletId)));
        } else {
          const defaults = this.buildDefaultStandees(resolvedOutletId);
          this.standees.set(defaults);
          this.persistStandees(defaults);
        }
        this.isLoading.set(false);
      },
      error: () => {
        const resolvedOutletId = this.merchantSlug();
        if (this.standees().length === 0) {
          this.standees.set(this.buildDefaultStandees(resolvedOutletId));
        }
        this.isLoading.set(false);
      }
    });
  }

  addStandee(label: string, type: QrStandeeType, tableNumber?: number): void {
    const trimmed = label.trim() || 'Shop QR Standee';
    const sourceTag =
      type === 'TABLE' && tableNumber
        ? `TABLE_${tableNumber}`
        : `${type}_${Date.now().toString().slice(-4)}`;
    const targetUrl = buildCustomerOrderUrl(this.merchantSlug(), sourceTag);

    const newStandee: QrStandeeViewModel = {
      id: `qr-${Date.now()}`,
      label: trimmed,
      type,
      tableNumber: type === 'TABLE' ? tableNumber : undefined,
      sourceTag,
      targetUrl,
      qrSvgDataUri: generateMerchantQrSvg(targetUrl),
      scanCount: 0,
      orderCount: 0,
      isActive: true
    };

    const next = [...this.standees(), newStandee];
    this.standees.set(next);
    this.persistStandees(next);
  }

  addTableBatch(startTable: number, endTable: number): void {
    const outlet = this.merchantSlug();
    const batch: QrStandeeViewModel[] = [];
    for (let t = startTable; t <= endTable; t++) {
      const sourceTag = `TABLE_${t}`;
      const targetUrl = buildCustomerOrderUrl(outlet, sourceTag);
      batch.push({
        id: `qr-table-${t}-${Date.now()}`,
        label: `Table #${t} QR Tent`,
        type: 'TABLE',
        tableNumber: t,
        sourceTag,
        targetUrl,
        qrSvgDataUri: generateMerchantQrSvg(targetUrl),
        scanCount: 0,
        orderCount: 0,
        isActive: true
      });
    }
    const next = [...this.standees(), ...batch];
    this.standees.set(next);
    this.persistStandees(next);
  }

  setPrintModal(standee: QrStandeeViewModel | null): void {
    this.selectedForPrint.set(standee);
  }

  toggleActive(id: string): void {
    const next = this.standees().map(s => (s.id === id ? { ...s, isActive: !s.isActive } : s));
    this.standees.set(next);
    this.persistStandees(next);
  }

  deleteStandee(id: string): void {
    const next = this.standees().filter(s => s.id !== id);
    this.standees.set(next);
    this.persistStandees(next);
  }

  private hydrateStandee(raw: any, outletId: string): QrStandeeViewModel {
    const sourceTag = raw?.sourceTag || 'COUNTER';
    const targetUrl = buildCustomerOrderUrl(outletId, sourceTag);
    return {
      id: raw?.id || `qr-${Date.now()}`,
      label: raw?.label || 'Shop Counter QR',
      type: (raw?.type as QrStandeeType) || 'COUNTER',
      tableNumber: raw?.tableNumber,
      sourceTag,
      targetUrl,
      qrSvgDataUri: generateMerchantQrSvg(targetUrl),
      scanCount: Number(raw?.scanCount) || 0,
      orderCount: Number(raw?.orderCount) || 0,
      isActive: raw?.isActive !== false,
      lastScannedAt: raw?.lastScannedAt
    };
  }

  private buildDefaultStandees(outletId: string): QrStandeeViewModel[] {
    const counterUrl = buildCustomerOrderUrl(outletId, 'MAIN_COUNTER');
    const windowUrl = buildCustomerOrderUrl(outletId, 'STORE_ENTRANCE');
    return [
      {
        id: 'qr-main-counter',
        label: 'Billing Counter Standee',
        type: 'COUNTER',
        sourceTag: 'MAIN_COUNTER',
        targetUrl: counterUrl,
        qrSvgDataUri: generateMerchantQrSvg(counterUrl),
        scanCount: 0,
        orderCount: 0,
        isActive: true
      },
      {
        id: 'qr-store-entrance',
        label: 'Shop Entrance / Window Poster',
        type: 'WINDOW',
        sourceTag: 'STORE_ENTRANCE',
        targetUrl: windowUrl,
        qrSvgDataUri: generateMerchantQrSvg(windowUrl),
        scanCount: 0,
        orderCount: 0,
        isActive: true
      }
    ];
  }

  private persistStandees(standees: QrStandeeViewModel[]): void {
    this.isSaving.set(true);
    const payload = standees.map(({ qrSvgDataUri, ...rest }) => rest);
    this.http.put<any>('/api/v1/merchant/qr-standees', { standees: payload }).subscribe({
      next: () => this.isSaving.set(false),
      error: () => this.isSaving.set(false)
    });
  }
}
