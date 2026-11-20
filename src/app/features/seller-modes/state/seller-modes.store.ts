import { Injectable, signal, inject } from '@angular/core';
import { SellerModesRepository } from '../data-access/seller-modes.repository';
import { SellerModesViewModel } from '../models/seller-modes-view.model';

const DEFAULT_SELLER_MODES: SellerModesViewModel[] = [
  {
    id: 'mode-pos',
    title: '🏪 Walk-in Counter POS Mode',
    subtitle: 'High-speed counter checkout with instant thermal receipt printing, cash/UPI collection, and barcode scanning.'
  },
  {
    id: 'mode-online',
    title: '🛵 Hyperlocal Express Delivery Mode',
    subtitle: 'Marketplace orders dispatched within a 10 km customer radius with live ETA and delivery boy routing.'
  },
  {
    id: 'mode-table-qr',
    title: '📱 Table QR & Dine-in Self Order',
    subtitle: 'Customers scan table standee QR codes, place order directly from mobile, and tickets print in kitchen.'
  },
  {
    id: 'mode-preorder',
    title: '📦 Scheduled Pre-orders & Bulk Pickups',
    subtitle: 'Advance bookings for morning fresh harvest, festival bulk sweets, and catering batches with token pickup slots.'
  }
];

@Injectable()
export class SellerModesStore {
  private repo = inject(SellerModesRepository);

  readonly items = signal<SellerModesViewModel[]>([...DEFAULT_SELLER_MODES]);
  readonly loading = signal<boolean>(false);

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.repo.getList().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.items.set(data);
        } else {
          this.items.set(DEFAULT_SELLER_MODES);
        }
        this.loading.set(false);
      },
      error: () => {
        this.items.set(DEFAULT_SELLER_MODES);
        this.loading.set(false);
      }
    });
  }
}
