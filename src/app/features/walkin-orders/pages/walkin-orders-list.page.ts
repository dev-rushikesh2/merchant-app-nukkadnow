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
  readonly authStore = inject(MerchantAuthStore);
  private sub = new Subscription();

  // Mobile View Switcher: 'catalog' or 'ticket'
  readonly activeMobileView = signal<'catalog' | 'ticket'>('catalog');

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

  // Products Catalog (loaded from live backend catalogue API with tenant fallback)
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
        this.activeCategory.set('All');
        this.searchQuery.set('');
        this.loadCatalogProducts();
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadCatalogProducts(): void {
    this.isLoading.set(true);
    const activeMerchant = this.authStore.activeMerchant();
    const activeTenant = activeMerchant.tenantId;
    const outletId = activeMerchant.outletId;
    this.catalogueApi.fetchProducts(outletId).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          const mapped: PosProduct[] = data.map((p: any) => ({
            id: p.id,
            name: p.title || p.name,
            emoji: this.getItemEmoji(p.title || p.name),
            category: p.category || 'General',
            price: p.priceRupees || Math.round((p.pricePaise || 0) / 100),
            inStock: p.inStock !== false
          }));
          this.products.set(mapped);
        } else {
          this.products.set(this.getFallbackProductsForTenant(activeTenant));
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.products.set(this.getFallbackProductsForTenant(activeTenant));
        this.isLoading.set(false);
      }
    });
  }

  private getFallbackProductsForTenant(tenantId: string): PosProduct[] {
    switch (tenantId) {
      case 'merchant-sabji-001':
        return [
          { id: 'prod-sabji-001', name: 'Fresh Nagpur Palak (Spinach)', emoji: '🥬', category: 'Vegetables & Fruits', price: 25, inStock: true },
          { id: 'prod-sabji-002', name: 'Farm Fresh Desi Tomatoes', emoji: '🍅', category: 'Vegetables & Fruits', price: 40, inStock: true },
          { id: 'prod-sabji-003', name: 'Green Shimla Mirch (Capsicum)', emoji: '🫑', category: 'Vegetables & Fruits', price: 35, inStock: true },
          { id: 'prod-sabji-004', name: 'Fresh Desi Kothimbir (Coriander)', emoji: '🌿', category: 'Vegetables & Fruits', price: 15, inStock: true },
          { id: 'prod-sabji-005', name: 'Local Vidarbha Red Onions', emoji: '🧅', category: 'Vegetables & Fruits', price: 30, inStock: true },
          { id: 'prod-sabji-006', name: 'Fresh Pahadi Potatoes (Aloo)', emoji: '🥔', category: 'Vegetables & Fruits', price: 28, inStock: true },
          { id: 'prod-sabji-007', name: 'Fresh Ginger (Adrak)', emoji: '🫚', category: 'Vegetables & Fruits', price: 40, inStock: true },
          { id: 'prod-sabji-008', name: 'Spicy Green Chillies (Mirchi)', emoji: '🌶️', category: 'Vegetables & Fruits', price: 20, inStock: true },
        ];
      case 'merchant-garguti-003':
        return [
          { id: 'prod-garguti-001', name: 'Vidarbha Special Spicy Poha Chivda (500g)', emoji: '🥟', category: 'Home Bakery & Traditional Snacks', price: 160, inStock: true },
          { id: 'prod-garguti-002', name: 'Crispy Fried Bakarwadi (400g)', emoji: '🥨', category: 'Home Bakery & Traditional Snacks', price: 150, inStock: true },
          { id: 'prod-garguti-003', name: 'Pure Desi Ghee Besan Laddoo (500g)', emoji: '🍯', category: 'Home Bakery & Traditional Snacks', price: 280, inStock: true },
          { id: 'prod-garguti-004', name: 'Traditional Bhajani Chakli (250g)', emoji: '🌀', category: 'Home Bakery & Traditional Snacks', price: 110, inStock: true },
          { id: 'prod-garguti-005', name: 'Crispy Sweet Shankarpale (350g)', emoji: '🍪', category: 'Home Bakery & Traditional Snacks', price: 120, inStock: true },
        ];
      case 'merchant-sweets-004':
        return [
          { id: 'prod-sweets-001', name: 'Famous Nagpur Orange Barfi (500g)', emoji: '🍊', category: 'Dairy, Sweets & Bakery', price: 340, inStock: true },
          { id: 'prod-sweets-002', name: 'Pure Ghee Motichoor Laddoo (500g)', emoji: '🥮', category: 'Dairy, Sweets & Bakery', price: 260, inStock: true },
          { id: 'prod-sweets-003', name: 'Fresh Malai Buffalo Paneer (200g)', emoji: '🧀', category: 'Dairy, Sweets & Bakery', price: 95, inStock: true },
          { id: 'prod-sweets-004', name: 'Kaju Katli Diamond Silver (400g)', emoji: '💎', category: 'Dairy, Sweets & Bakery', price: 450, inStock: true },
          { id: 'prod-sweets-005', name: 'Hot Crispy Punjabi Samosa (2 pcs)', emoji: '🥟', category: 'Dairy, Sweets & Bakery', price: 40, inStock: true },
        ];
      case 'merchant-kirana-002':
      default:
        return [
          { id: 'prod-kirana-001', name: 'Sharbati Wheat Atta (5 kg)', emoji: '🌾', category: 'Grocery & Daily Needs', price: 245, inStock: true },
          { id: 'prod-kirana-002', name: 'Kolam Steam Daily Rice (5 kg)', emoji: '🍚', category: 'Grocery & Daily Needs', price: 320, inStock: true },
          { id: 'prod-kirana-003', name: 'Fortune Mustard Oil (1L Pouch)', emoji: '🫒', category: 'Grocery & Daily Needs', price: 155, inStock: true },
          { id: 'prod-kirana-004', name: 'Tata Salt Vacuum Evaporated (1 kg)', emoji: '🧂', category: 'Grocery & Daily Needs', price: 28, inStock: true },
          { id: 'prod-kirana-005', name: 'Unpolished Toor Dal (1 kg)', emoji: '🥣', category: 'Grocery & Daily Needs', price: 168, inStock: true },
          { id: 'prod-kirana-006', name: 'Amul Taaza Homogenised Milk (1L)', emoji: '🥛', category: 'Grocery & Daily Needs', price: 74, inStock: true },
        ];
    }
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
    if (n.includes('spinach') || n.includes('palak') || n.includes('coriander') || n.includes('kothimbir')) return '🥬';
    if (n.includes('onion') || n.includes('kanda')) return '🧅';
    if (n.includes('capsicum') || n.includes('shimla')) return '🫑';
    if (n.includes('ginger') || n.includes('adrak')) return '🫚';
    if (n.includes('chilli') || n.includes('mirchi')) return '🌶️';
    if (n.includes('mango') || n.includes('fruit')) return '🥭';
    return '📦';
  }

  // Dynamic Categories derived from active merchant products
  readonly dynamicCategories = computed(() => {
    const list = this.products();
    const set = new Set<string>();
    list.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  });

  getCategoryBadge(cat: string): string {
    if (cat === 'All') return 'All';
    const c = cat.toLowerCase();
    if (c.includes('veg') || c.includes('fruit') || c.includes('greens')) return `🥦 ${cat}`;
    if (c.includes('snack') || c.includes('chivda') || c.includes('bakery')) return `🥟 ${cat}`;
    if (c.includes('dairy') || c.includes('sweet') || c.includes('dessert')) return `🍰 ${cat}`;
    if (c.includes('grocery') || c.includes('kirana') || c.includes('grain')) return `🌾 ${cat}`;
    if (c.includes('beverage') || c.includes('tea') || c.includes('coffee')) return `☕ ${cat}`;
    return `🏷️ ${cat}`;
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

  setActiveMobileView(view: 'catalog' | 'ticket') {
    this.activeMobileView.set(view);
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

    this.showToast(`+ Added 1x ${product.name}`);
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
        this.activeMobileView.set('catalog');
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