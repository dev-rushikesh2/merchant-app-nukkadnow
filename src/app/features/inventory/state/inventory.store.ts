import { Injectable, signal, computed, inject } from '@angular/core';
import { InventoryItem, StockMovementRecord, StockAdjustmentReason, INITIAL_INVENTORY, INITIAL_MOVEMENTS } from '../models/inventory-view.model';
import { InventoryApi } from '../data-access/inventory.api';

@Injectable({ providedIn: 'root' })
export class InventoryStore {
  private api = inject(InventoryApi);

  readonly items = signal<InventoryItem[]>(INITIAL_INVENTORY);
  readonly movements = signal<StockMovementRecord[]>(INITIAL_MOVEMENTS);
  readonly filterMode = signal<'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  readonly searchQuery = signal<string>('');
  readonly isLoading = signal<boolean>(false);
  readonly currentOutletId = signal<string>('outlet-main');

  constructor() {
    this.loadInventory();
  }

  loadInventory(outletId = 'outlet-main') {
    this.currentOutletId.set(outletId);
    this.isLoading.set(true);
    this.api.fetchInventory(outletId).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.items.set(data);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });

    this.api.fetchMovements(outletId).subscribe({
      next: (movs) => {
        if (movs && movs.length > 0) {
          this.movements.set(movs);
        }
      },
    });
  }

  readonly filteredItems = computed(() => {
    const mode = this.filterMode();
    const query = this.searchQuery().trim().toLowerCase();

    return this.items().filter((item) => {
      const matchQuery = !query || item.title.toLowerCase().includes(query) || item.category.toLowerCase().includes(query);
      if (!matchQuery) return false;

      if (mode === 'LOW_STOCK') return item.isLowStock && item.inStock;
      if (mode === 'OUT_OF_STOCK') return !item.inStock || item.currentStock === 0;
      return true;
    });
  });

  readonly totalItemsCount = computed(() => this.items().length);
  readonly lowStockCount = computed(() => this.items().filter((i) => i.isLowStock && i.inStock).length);
  readonly outOfStockCount = computed(() => this.items().filter((i) => !i.inStock || i.currentStock === 0).length);

  setFilter(mode: 'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK') {
    this.filterMode.set(mode);
  }

  setSearch(q: string) {
    this.searchQuery.set(q);
  }

  quickAdjust(id: string, delta: number) {
    const outletId = this.currentOutletId();

    this.items.update((list) =>
      list.map((item) => {
        if (item.id === id) {
          const newStock = Math.max(0, item.currentStock + delta);
          const isLow = newStock <= item.lowStockThreshold;
          const inStock = newStock > 0;

          this.recordMovement(item, delta, 'RESTOCK', 'Quick Counter Adjustment');

          return {
            ...item,
            currentStock: newStock,
            isLowStock: isLow,
            inStock: inStock,
            lastUpdated: 'Just now',
          };
        }
        return item;
      })
    );

    // Sync to backend
    this.api.adjustStock({
      variantId: id,
      outletId,
      quantityChange: delta,
      reason: 'RESTOCK',
      notes: 'Quick Counter Adjustment',
    }).subscribe();
  }

  detailedAdjust(id: string, delta: number, reason: StockAdjustmentReason, note: string) {
    const outletId = this.currentOutletId();

    this.items.update((list) =>
      list.map((item) => {
        if (item.id === id) {
          const newStock = Math.max(0, item.currentStock + delta);
          const isLow = newStock <= item.lowStockThreshold;
          const inStock = newStock > 0;

          this.recordMovement(item, delta, reason, note);

          return {
            ...item,
            currentStock: newStock,
            isLowStock: isLow,
            inStock: inStock,
            lastUpdated: 'Just now',
          };
        }
        return item;
      })
    );

    // Sync to backend
    this.api.adjustStock({
      variantId: id,
      outletId,
      quantityChange: delta,
      reason,
      notes: note,
    }).subscribe();
  }

  toggleAvailability(id: string) {
    this.items.update((list) =>
      list.map((item) => (item.id === id ? { ...item, inStock: !item.inStock } : item))
    );
  }

  private recordMovement(item: InventoryItem, delta: number, reason: StockAdjustmentReason, note: string) {
    const record: StockMovementRecord = {
      id: 'mov-' + Date.now(),
      productId: item.productId,
      productTitle: item.title,
      delta,
      previousStock: item.currentStock,
      newStock: Math.max(0, item.currentStock + delta),
      reason,
      note,
      actorName: 'Staff (Register)',
      timestamp: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    this.movements.update((m) => [record, ...m]);
  }
}
