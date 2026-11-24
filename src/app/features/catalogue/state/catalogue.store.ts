import { Injectable, signal, computed, inject } from '@angular/core';
import { CatalogueApi } from '../data-access/catalogue.api';
import { ProductItem } from '../models/catalogue-view.model';
import { MerchantAuthStore } from '../../../core/auth/merchant-auth.store';
import { OutletSwitcherStore } from '../../../core/outlet-context/outlet-switcher.store';

@Injectable({ providedIn: 'root' })
export class CatalogueStore {
  private api = inject(CatalogueApi);
  private authStore = inject(MerchantAuthStore);
  private outletStore = inject(OutletSwitcherStore);

  readonly products = signal<ProductItem[]>([]);
  readonly selectedCategory = signal<string>('All');
  readonly searchQuery = signal<string>('');
  readonly loading = signal<boolean>(false);
  readonly currentOutletId = signal<string>('outlet-main');

  constructor() {
    this.init();
  }

  private init(): void {
    const outletId = this.outletStore.activeOutletId() || (this.authStore.activeMerchant()?.outletId ?? '');
    this.loadProducts(outletId);

    this.authStore.tenantSwitched$.subscribe(() => {
      const newOutletId = this.outletStore.activeOutletId() || (this.authStore.activeMerchant()?.outletId ?? '');
      this.loadProducts(newOutletId);
    });
  }

  loadProducts(outletId = 'outlet-main') {
    this.currentOutletId.set(outletId);
    this.loading.set(true);
    this.api.fetchProducts(outletId).subscribe({
      next: (data) => {
        this.products.set(data || []);
        this.loading.set(false);
      },
      error: () => {
        this.products.set([]);
        this.loading.set(false);
      },
    });
  }

  readonly categories = computed(() => {
    const set = new Set<string>();
    this.products().forEach((p) => set.add(p.category));
    return ['All', ...Array.from(set)];
  });

  readonly filteredProducts = computed(() => {
    const cat = this.selectedCategory();
    const query = this.searchQuery().trim().toLowerCase();

    return this.products().filter((p) => {
      const matchCat = cat === 'All' || p.category === cat;
      const matchQuery = !query || p.title.toLowerCase().includes(query) || p.description.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });
  });

  readonly inStockCount = computed(() => this.products().filter((p) => p.inStock).length);
  readonly outOfStockCount = computed(() => this.products().filter((p) => !p.inStock).length);

  setCategory(cat: string) {
    this.selectedCategory.set(cat);
  }

  setSearch(q: string) {
    this.searchQuery.set(q);
  }

  toggleAvailability(productId: string) {
    this.products.update((list) =>
      list.map((p) => (p.id === productId ? { ...p, inStock: !p.inStock } : p))
    );
  }

  saveProduct(product: ProductItem) {
    this.products.update((list) => {
      const exists = list.some((p) => p.id === product.id);
      if (exists) {
        return list.map((p) => (p.id === product.id ? product : p));
      }
      return [product, ...list];
    });

    // Sync to backend catalog-service
    this.api.createProduct(product).subscribe();
  }

  deleteProduct(id: string) {
    this.products.update((list) => list.filter((p) => p.id !== id));
  }
}
