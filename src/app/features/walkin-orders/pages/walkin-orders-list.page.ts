import { Component, signal, computed, ChangeDetectionStrategy, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { CatalogueApi } from '../../catalogue/data-access/catalogue.api';
import { OrderInboxApi } from '../../order-inbox/data-access/order-inbox.api';
import { MerchantAuthStore } from '../../../core/auth/merchant-auth.store';

export interface PosProduct {
  id: string;
  name: string;
  emoji: string;
  category: string;
  price: number;
  inStock: boolean;
}

export interface CartLine {
  product: PosProduct;
  quantity: number;
}

export interface CompletedWalkinReceipt {
  token: string;
  orderId: string;
  customerName: string;
  customerPhone?: string;
  items: CartLine[];
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  paymentMode: string;
  timestamp: string;
}

@Component({
  selector: 'merchant-walkin-orders-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './walkin-orders-list.page.html',
  styleUrls: ['./walkin-orders-list.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WalkinOrdersPageComponent implements OnInit, OnDestroy {
  private catalogueApi = inject(CatalogueApi);
  private orderApi = inject(OrderInboxApi);
  private authStore = inject(MerchantAuthStore);
  private sub = new Subscription();

  // Search & Category
  readonly searchQuery = signal<string>('');
  readonly activeCategory = signal<string>('All');

  // Customer selection
  readonly isGuest = signal<boolean>(true);
  readonly custName = signal<string>('');
  readonly custPhone = signal<string>('');

  // Payment Mode
  readonly paymentMode = signal<'Cash' | 'UPI' | 'Card' | 'Udhaar'>('UPI');

  // Discount %
  readonly discountPercent = signal<number>(0);

  // Products Catalog (loaded from live backend catalogue API)
  readonly products = signal<PosProduct[]>([]);
  readonly isLoading = signal<boolean>(false);

  // Cart Lines
  readonly cart = signal<CartLine[]>([]);

  // Modal receipt
  readonly receiptModal = signal<CompletedWalkinReceipt | null>(null);

  // Toast
  readonly posToast = signal<string | null>(null);

  ngOnInit(): void {
    this.loadCatalogProducts();
    this.sub.add(
      this.authStore.tenantSwitched$.subscribe(() => {
        this.cart.set([]);
        this.loadCatalogProducts();
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadCatalogProducts(): void {
    this.isLoading.set(true);
    this.catalogueApi.fetchProducts().subscribe({
      next: (data) => {
        const mapped: PosProduct[] = (data || []).map((p: any) => ({
          id: p.id,
          name: p.title || p.name,
          emoji: this.getItemEmoji(p.title || p.name),
          category: p.category || 'General',
          price: p.priceRupees || Math.round((p.pricePaise || 0) / 100),
          inStock: p.inStock !== false
        }));
        this.products.set(mapped);
        this.isLoading.set(false);
      },
      error: () => {
        this.products.set([]);
        this.isLoading.set(false);
      }
    });
  }

  private getItemEmoji(name: string): string {
    const n = (name || '').toLowerCase();
    if (n.includes('tea') || n.includes('chai') || n.includes('coffee')) return '☕';
    if (n.includes('milk') || n.includes('dairy') || n.includes('butter') || n.includes('paneer')) return '🥛';
    if (n.includes('bread') || n.includes('bun') || n.includes('bakery') || n.includes('cake')) return '🍞';
    if (n.includes('samosa') || n.includes('snack') || n.includes('chivda') || n.includes('bakarwadi')) return '🥟';
    if (n.includes('rice') || n.includes('atta') || n.includes('dal') || n.includes('oil')) return '🌾';
    if (n.includes('barfi') || n.includes('sweet') || n.includes('laddoo') || n.includes('pedha')) return '🍰';
    if (n.includes('tomato') || n.includes('potato') || n.includes('sabji') || n.includes('vegetable')) return '🥦';
    if (n.includes('mango') || n.includes('fruit')) return '🥭';
    return '📦';
  }

  // Filtered Products
  readonly filteredProducts = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.activeCategory();
    let list = this.products();

    if (cat !== 'All') {
      list = list.filter(p => p.category === cat);
    }

    if (q) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    return list;
  });

  // Cart calculations
  readonly cartItemsCount = computed(() =>
    this.cart().reduce((sum, item) => sum + item.quantity, 0)
  );

  readonly subtotal = computed(() =>
    this.cart().reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  );

  readonly discountAmount = computed(() =>
    Math.round((this.subtotal() * this.discountPercent()) / 100)
  );

  readonly taxableAmount = computed(() =>
    this.subtotal() - this.discountAmount()
  );

  readonly taxAmount = computed(() =>
    Math.round(this.taxableAmount() * 0.05) // 5% GST
  );

  readonly grandTotal = computed(() =>
    this.taxableAmount() + this.taxAmount()
  );

  setCategory(cat: string) {
    this.activeCategory.set(cat);
  }

  addToCart(product: PosProduct) {
    if (!product.inStock) {
      this.showToast(`"${product.name}" is currently marked out of stock!`);
      return;
    }

    this.cart.update(list => {
      const existing = list.find(l => l.product.id === product.id);
      if (existing) {
        return list.map(l => l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l);
      }
      return [...list, { product, quantity: 1 }];
    });
  }

  updateQty(productId: string, delta: number) {
    this.cart.update(list => {
      return list
        .map(l => {
          if (l.product.id === productId) {
            const nextQty = l.quantity + delta;
            return nextQty > 0 ? { ...l, quantity: nextQty } : null;
          }
          return l;
        })
        .filter((l): l is CartLine => l !== null);
    });
  }

  increaseQty(productId: string) {
    this.updateQty(productId, 1);
  }

  decreaseQty(productId: string) {
    this.updateQty(productId, -1);
  }

  removeFromCart(productId: string) {
    this.cart.update(list => list.filter(l => l.product.id !== productId));
  }

  clearCart() {
    this.cart.set([]);
  }

  simulateBarcodeScan() {
    const list = this.products();
    if (list.length === 0) {
      this.showToast('No products in catalogue to scan.');
      return;
    }
    const randomProd = list[Math.floor(Math.random() * list.length)];
    this.addToCart(randomProd);
    this.showToast(`🔍 Barcode scanned: Added "${randomProd.name}"`);
  }

  setDiscount(pct: number) {
    this.discountPercent.set(pct);
  }

  completeWalkinOrder() {
    if (this.cart().length === 0) {
      this.showToast('Please add items to ticket first!');
      return;
    }

    const nextTokenNum = Math.floor(Math.random() * 50) + 20;
    const token = `Q-${nextTokenNum}`;
    const custName = this.isGuest() ? 'Walk-in Guest' : (this.custName() || 'Walk-in Customer');
    const custPhone = this.isGuest() ? undefined : this.custPhone();
    const cartItems = [...this.cart()];
    const subtotalVal = this.subtotal();
    const discountVal = this.discountAmount();
    const taxVal = this.taxAmount();
    const grandVal = this.grandTotal();
    const paymentModeVal = this.paymentMode();

    const orderPayload = {
      customerName: custName,
      customerPhone: custPhone,
      items: cartItems.map(c => ({
        name: c.product.name,
        quantity: c.quantity,
        price: c.product.price
      })),
      paymentMode: paymentModeVal,
      discount: discountVal,
      token
    };

    this.orderApi.createWalkinOrder(orderPayload).subscribe({
      next: (res) => {
        const receipt: CompletedWalkinReceipt = {
          token,
          orderId: res?.order?.orderNumber || `#WALK-${Date.now().toString().slice(-4)}`,
          customerName: custName,
          customerPhone: custPhone,
          items: cartItems,
          subtotal: subtotalVal,
          discount: discountVal,
          tax: taxVal,
          grandTotal: grandVal,
          paymentMode: paymentModeVal,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        this.receiptModal.set(receipt);
        this.clearCart();
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Failed to record walkin order');
      }
    });
  }

  closeReceipt() {
    this.receiptModal.set(null);
  }

  printReceipt() {
    window.print();
  }

  private showToast(msg: string) {
    this.posToast.set(msg);
    setTimeout(() => this.posToast.set(null), 2500);
  }
}
