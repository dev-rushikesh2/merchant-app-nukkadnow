import { Injectable, signal, computed, inject } from '@angular/core';
import { InventoryItem, StockMovementRecord, StockAdjustmentReason } from '../models/inventory-view.model';
import { InventoryApi } from '../data-access/inventory.api';
import { MerchantAuthStore } from '../../../core/auth/merchant-auth.store';
import { OutletSwitcherStore } from '../../../core/outlet-context/outlet-switcher.store';

@Injectable({ providedIn: 'root' })
export class InventoryStore {
  private api = inject(InventoryApi);
  private authStore = inject(MerchantAuthStore);
  private outletStore = inject(OutletSwitcherStore);

  readonly items = signal<InventoryItem[]>([]);
  readonly movements = signal<StockMovementRecord[]>([]);
  readonly filterMode = signal<'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  readonly searchQuery = signal<string>('');
  readonly isLoading = signal<boolean>(false);
  readonly currentOutletId = signal<string>('outlet-main');

  constructor() {
    this.init();
  }

  private init(): void {
    const outletId = this.outletStore.activeOutletId() || this.authStore.activeMerchant().outletId;
    this.loadInventory(outletId);

    this.authStore.tenantSwitched$.subscribe(() => {
      const newOutletId = this.outletStore.activeOutletId() || this.authStore.activeMerchant().outletId;
      this.loadInventory(newOutletId);
    });
  }

  loadInventory(outletId = 'outlet-main') {
    this.currentOutletId.set(outletId);
    this.isLoading.set(true);
    this.api.fetchInventory(outletId).subscribe({
      next: (data) => {
        this.items.set(data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.items.set([]);
        this.isLoading.set(false);
      },
    });

    this.api.fetchMovements(outletId).subscribe({
      next: (movs) => {
        this.movements.set(movs || []);
      },
      error: () => {
        this.movements.set([]);
      }
    });
  }

  readonly filteredItems = computed(() => {
    const mode = this.filterMode();
    const query = this.searchQuery().trim().toLowerCase();

    return this.items().filter((item) => {
      const matchQuery = !query || item.title.toLowerCase().includes(query) || item.category.toLowerCase().includes(query);
      if (!matchQuery) return false;

      if (mode === 'LOW_STOCK') return item.isLowStock && item.inStock;
      if (mode === 'OUT_OF_STOCK') return !item.inStock;
      return true;
    });
  });

  readonly totalItemsCount = computed(() => this.items().length);
  readonly totalProductsCount = computed(() => this.items().length);
  readonly lowStockCount = computed(() => this.items().filter((i) => i.isLowStock && i.inStock).length);
  readonly outOfStockCount = computed(() => this.items().filter((i) => !i.inStock).length);

  setFilter(mode: 'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK') {
    this.filterMode.set(mode);
  }

  setSearch(q: string) {
    this.searchQuery.set(q);
  }

  adjustStock(params: {
    itemId: string;
    delta: number;
    reason: StockAdjustmentReason;
    note?: string;
    actorName?: string;
  }) {
    const item = this.items().find((i) => i.id === params.itemId);
    if (!item) return;

    const prev = item.currentStock;
    const next = Math.max(0, prev + params.delta);
    const inStock = next > 0;
    const isLowStock = next > 0 && next <= item.lowStockThreshold;

    this.items.update((list) =>
      list.map((i) =>
        i.id === params.itemId
          ? {
              ...i,
              currentStock: next,
              inStock,
              isLowStock,
              lastUpdated: 'Just now',
            }
          : i
      )
    );

    const movement: StockMovementRecord = {
      id: `mov-${Date.now()}`,
      productId: item.productId,
      productTitle: item.title,
      delta: params.delta,
      previousStock: prev,
      newStock: next,
      reason: params.reason,
      note: params.note,
      actorName: params.actorName || 'Owner (You)',
      timestamp: 'Just now',
    };

    this.movements.update((list) => [movement, ...list]);

    // Sync to backend
    this.api.adjustStock({
      variantId: params.itemId,
      outletId: this.currentOutletId(),
      quantityChange: params.delta,
      reason: params.reason,
      notes: params.note,
    }).subscribe();
  }

  quickAdjust(id: string, delta: number) {
    this.adjustStock({ itemId: id, delta, reason: 'RESTOCK', note: 'Quick Counter Adjustment' });
  }

  detailedAdjust(id: string, delta: number, reason: StockAdjustmentReason, note: string) {
    this.adjustStock({ itemId: id, delta, reason, note });
  }

  toggleAvailability(id: string) {
    this.items.update(list =>
      list.map(item => item.id === id ? { ...item, inStock: !item.inStock } : item)
    );
  }

  updateThreshold(itemId: string, newThreshold: number) {
    this.items.update((list) =>
      list.map((i) =>
        i.id === itemId
          ? {
              ...i,
              lowStockThreshold: newThreshold,
              isLowStock: i.currentStock <= newThreshold,
            }
          : i
      )
    );
  }
}
