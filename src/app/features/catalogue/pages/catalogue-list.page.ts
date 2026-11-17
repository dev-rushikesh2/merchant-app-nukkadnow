import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CatalogueStore } from '../state/catalogue.store';
import { ProductItem } from '../models/catalogue-view.model';

export interface CategoryInfo {
  id: string;
  name: string;
  emoji: string;
  itemCount: number;
  isActive: boolean;
}

@Component({
  selector: 'merchant-catalogue-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './catalogue-list.page.html',
  styleUrls: ['./catalogue-list.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogueListPageComponent {
  readonly Math = Math;
  store = inject(CatalogueStore);
  router = inject(Router);

  // Active sub-tab: 'products' | 'categories' | 'low-stock'
  readonly activeSubTab = signal<'products' | 'categories' | 'low-stock'>('products');

  // Search
  readonly searchInput = signal<string>('');

  // Custom added categories
  readonly customCategories = signal<CategoryInfo[]>([]);

  // Disabled categories
  readonly disabledCategoryIds = signal<Set<string>>(new Set());

  // Dynamic Categories list derived from real active merchant products
  readonly categoriesList = computed<CategoryInfo[]>(() => {
    const prods = this.store.products();
    const map = new Map<string, number>();
    for (const p of prods) {
      const cat = p.category || 'General';
      map.set(cat, (map.get(cat) || 0) + 1);
    }

    const disabled = this.disabledCategoryIds();
    const derived: CategoryInfo[] = Array.from(map.entries()).map(([name, itemCount], idx) => {
      const id = `cat-${idx + 1}`;
      return {
        id,
        name,
        emoji: this.getCategoryEmoji(name),
        itemCount,
        isActive: !disabled.has(id)
      };
    });

    const custom = this.customCategories()
      .filter(c => !map.has(c.name))
      .map(c => ({ ...c, isActive: !disabled.has(c.id) }));

    return [...derived, ...custom];
  });

  private getCategoryEmoji(name: string): string {
    const n = (name || '').toLowerCase();
    if (n.includes('sweet') || n.includes('dessert') || n.includes('cake') || n.includes('bakery')) return '🍰';
    if (n.includes('veg') || n.includes('sabji') || n.includes('fruit')) return '🥦';
    if (n.includes('grocery') || n.includes('kirana') || n.includes('grain')) return '🌾';
    if (n.includes('dairy') || n.includes('milk')) return '🥛';
    if (n.includes('snack') || n.includes('chivda') || n.includes('namkeen')) return '🥟';
    if (n.includes('chai') || n.includes('tea') || n.includes('coffee') || n.includes('beverage')) return '☕';
    return '🏷️';
  }

  // Add Category modal state
  readonly showAddCategoryModal = signal<boolean>(false);
  readonly newCategoryName = signal<string>('');
  readonly newCategoryEmoji = signal<string>('🏷️');

  // Toast
  readonly toast = signal<string | null>(null);

  // Low Stock Items (< 10)
  readonly lowStockProducts = computed(() =>
    this.store.products().filter(p => p.stockCount <= 10)
  );

  // Filtered Products for current sub-tab
  readonly displayedProducts = computed(() => {
    const sub = this.activeSubTab();
    const query = this.searchInput().toLowerCase().trim();
    let list = sub === 'low-stock' ? this.lowStockProducts() : this.store.filteredProducts();

    if (query) {
      list = list.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }
    return list;
  });

  setSubTab(tab: 'products' | 'categories' | 'low-stock') {
    this.activeSubTab.set(tab);
  }

  selectCategory(cat: string) {
    this.store.setCategory(cat);
  }

  toggleStock(productId: string) {
    this.store.toggleAvailability(productId);
    const prod = this.store.products().find(p => p.id === productId);
    this.showToast(`Updated "${prod?.title}" availability to ${prod?.inStock ? 'In Stock' : 'Out of Stock'}.`);
  }

  editProduct(p: ProductItem) {
    this.router.navigate(['/catalogue', p.id, 'edit']);
  }

  createProduct() {
    this.router.navigate(['/catalogue/new']);
  }

  duplicateProduct(p: ProductItem) {
    const copy: ProductItem = {
      ...p,
      id: `prod-${Date.now()}`,
      title: `${p.title} (Copy)`,
      stockCount: 10
    };
    this.store.saveProduct(copy);
    this.showToast(`Duplicated "${p.title}" successfully.`);
  }

  deleteProduct(id: string, name: string) {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      this.store.deleteProduct(id);
      this.showToast(`Product "${name}" deleted.`);
    }
  }

  toggleCategory(id: string) {
    this.disabledCategoryIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  addCategory() {
    const name = this.newCategoryName().trim();
    if (!name) return;

    const newCat: CategoryInfo = {
      id: `cat-${Date.now()}`,
      name,
      emoji: this.newCategoryEmoji() || '🏷️',
      itemCount: 0,
      isActive: true
    };

    this.customCategories.update(list => [...list, newCat]);
    this.showAddCategoryModal.set(false);
    this.newCategoryName.set('');
    this.showToast(`Category "${name}" created successfully!`);
  }

  private showToast(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(null), 2800);
  }
}
