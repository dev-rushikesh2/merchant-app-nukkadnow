import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OrderInboxApi, OrderApiResponse } from '../data-access/order-inbox.api';
import { MerchantAuthStore } from '../../../core/auth/merchant-auth.store';
import { Subscription } from 'rxjs';

export interface MerchantOrder {
  id: string;
  orderNumber: string;
  time: string;
  date?: string;
  amount: number;
  itemsCount: number;
  customerName: string;
  customerPhone?: string;
  fulfilmentType: 'Home Delivery' | 'Self Pickup';
  distance?: string;
  status: 'New' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
  stepIndex?: number; // 0: Accepted, 1: Preparing, 2: Ready, 3: Out for Delivery
  items?: any[];
}

export interface PastOrder {
  id: string;
  date: string;
  time: string;
  amount: number;
  itemsCount: number;
  status: 'Completed' | 'Cancelled' | 'Returned';
}

@Component({
  selector: 'merchant-order-inbox-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './order-inbox-list.page.html',
  styleUrls: ['./order-inbox-list.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderInboxPageComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private orderApi = inject(OrderInboxApi);
  private authStore = inject(MerchantAuthStore);
  private sub = new Subscription();

  // Loading state
  readonly isLoading = signal<boolean>(true);

  // Sub Tab: 'inbox' | 'history'
  readonly subTab = signal<'inbox' | 'history'>('inbox');

  // Filter Pills in Live Inbox
  readonly activeFilter = signal<'All' | 'New' | 'Preparing' | 'Ready' | 'Completed'>('All');

  // Filter Pills in Order History
  readonly historyFilter = signal<'All' | 'Completed' | 'Cancelled' | 'Returned'>('All');

  // Search query
  readonly searchQuery = signal<string>('');

  // Live Orders Signal (Strictly from real API)
  readonly orders = signal<MerchantOrder[]>([]);

  // Order History Signal (Strictly from real API)
  readonly pastOrders = signal<PastOrder[]>([]);

  // History date range
  readonly dateRange = signal<string>('01 Nov 2026 – 30 Nov 2026');

  // Toast
  readonly toastMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadOrders();

    this.sub.add(
      this.authStore.tenantSwitched$.subscribe(() => {
        this.loadOrders();
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.orderApi.fetchOrders().subscribe({
      next: (res: OrderApiResponse) => {
        if (res && res.data) {
          const live: MerchantOrder[] = res.liveOrders || res.data.filter(
            (o: any) => o.status !== 'Completed' && o.status !== 'Cancelled'
          );
          const history: PastOrder[] = (res.pastOrders || res.data.filter(
            (o: any) => o.status === 'Completed' || o.status === 'Cancelled'
          )).map((o: any) => ({
            id: o.orderNumber || o.id,
            date: o.date || 'Today',
            time: o.time || '10:00 AM',
            amount: o.amount,
            itemsCount: o.itemsCount || (o.items ? o.items.length : 1),
            status: o.status === 'Cancelled' ? 'Cancelled' : 'Completed'
          }));

          this.orders.set(live.map((o: any) => ({
            ...o,
            id: o.orderNumber || o.id
          })));
          this.pastOrders.set(history);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.orders.set([]);
        this.pastOrders.set([]);
        this.isLoading.set(false);
      }
    });
  }

  // Filtered Live Orders computed
  readonly filteredOrders = computed(() => {
    const f = this.activeFilter();
    const q = this.searchQuery().toLowerCase().trim();
    let list = this.orders();

    if (f !== 'All') {
      list = list.filter(o => o.status === f);
    }
    if (q) {
      list = list.filter(o =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q)
      );
    }
    return list;
  });

  // Filtered History computed
  readonly filteredHistory = computed(() => {
    const hf = this.historyFilter();
    let list = this.pastOrders();
    if (hf !== 'All') {
      list = list.filter(o => o.status === hf);
    }
    return list;
  });

  setSubTab(tab: 'inbox' | 'history') {
    this.subTab.set(tab);
  }

  setFilter(f: 'All' | 'New' | 'Preparing' | 'Ready' | 'Completed') {
    this.activeFilter.set(f);
  }

  setHistoryFilter(hf: 'All' | 'Completed' | 'Cancelled' | 'Returned') {
    this.historyFilter.set(hf);
  }

  acceptOrder(orderId: string, event: Event) {
    event.stopPropagation();
    this.orderApi.updateOrderStatus(orderId, 'Preparing', 15).subscribe({
      next: () => {
        this.orders.update(list =>
          list.map(o => (o.id === orderId ? { ...o, status: 'Preparing', stepIndex: 1 } : o))
        );
        this.showToast(`Order ${orderId} accepted! Preparing timer started.`);
      },
      error: () => {
        this.showToast(`Error accepting order ${orderId}`);
      }
    });
  }

  rejectOrder(orderId: string, event: Event) {
    event.stopPropagation();
    this.orderApi.updateOrderStatus(orderId, 'Cancelled').subscribe({
      next: () => {
        this.orders.update(list =>
          list.map(o => (o.id === orderId ? { ...o, status: 'Cancelled' } : o))
        );
        this.showToast(`Order ${orderId} rejected.`);
      },
      error: () => {
        this.showToast(`Error rejecting order ${orderId}`);
      }
    });
  }

  markCompleted(orderId: string, event: Event) {
    event.stopPropagation();
    this.orderApi.updateOrderStatus(orderId, 'Completed').subscribe({
      next: () => {
        this.orders.update(list => list.filter(o => o.id !== orderId));
        this.showToast(`Order ${orderId} marked as completed!`);
      },
      error: () => {
        this.showToast(`Error updating order ${orderId}`);
      }
    });
  }

  openOrderDetails(orderId: string) {
    this.router.navigate(['/order-inbox', orderId.replace('#', '')]);
  }

  exportReport() {
    this.showToast('Exporting order report as CSV/Excel...');
  }

  private showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 2800);
  }
}
