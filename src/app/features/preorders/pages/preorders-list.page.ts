import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { OrderInboxApi } from '../../order-inbox/data-access/order-inbox.api';
import { MerchantAuthStore } from '../../../core/auth/merchant-auth.store';

export interface PreorderItemDetail {
  title: string;
  quantity: number;
  pricePaise: number;
}

export interface MerchantPreorder {
  id: string;
  orderNumber: string;
  token: string;
  customerName: string;
  customerPhone: string;
  scheduledDate: string;
  scheduledTimeRange: string;
  dayCategory: 'TODAY' | 'TOMORROW' | 'WEEKEND';
  items: PreorderItemDetail[];
  totalPaise: number;
  status: 'CONFIRMED' | 'IN_PREPARATION' | 'READY_FOR_PICKUP' | 'COLLECTED';
  paymentMode: string;
}

@Component({
  selector: 'merchant-preorders-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './preorders-list.page.html',
  styleUrls: ['./preorders-list.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreordersListPageComponent implements OnInit, OnDestroy {
  private orderApi = inject(OrderInboxApi);
  private authStore = inject(MerchantAuthStore);
  private sub = new Subscription();

  // Date Filter: 'ALL' | 'TODAY' | 'TOMORROW' | 'WEEKEND'
  readonly filterDate = signal<'ALL' | 'TODAY' | 'TOMORROW' | 'WEEKEND'>('ALL');

  // Status Filter: 'ALL' | 'CONFIRMED' | 'IN_PREPARATION' | 'READY_FOR_PICKUP' | 'COLLECTED'
  readonly filterStatus = signal<'ALL' | 'CONFIRMED' | 'IN_PREPARATION' | 'READY_FOR_PICKUP' | 'COLLECTED'>('ALL');

  // Search
  readonly searchQuery = signal<string>('');

  // Toast
  readonly toastMessage = signal<string | null>(null);

  // Preorders Signal (loaded live from merchant orders)
  readonly preorders = signal<MerchantPreorder[]>([]);
  readonly isLoading = signal<boolean>(false);

  ngOnInit(): void {
    this.loadPreorders();
    this.sub.add(
      this.authStore.tenantSwitched$.subscribe(() => {
        this.loadPreorders();
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadPreorders(): void {
    this.isLoading.set(true);
    this.orderApi.fetchOrders().subscribe({
      next: (res) => {
        const rawOrders = res.data || [];
        const mapped: MerchantPreorder[] = rawOrders.map((o: any) => {
          let st: MerchantPreorder['status'] = 'CONFIRMED';
          if (o.status === 'Preparing') st = 'IN_PREPARATION';
          else if (o.status === 'Ready') st = 'READY_FOR_PICKUP';
          else if (o.status === 'Completed') st = 'COLLECTED';

          const items: PreorderItemDetail[] = (o.items || []).map((it: any) => ({
            title: it.name,
            quantity: it.quantity,
            pricePaise: (it.price || 0) * 100
          }));

          return {
            id: o.id || o.orderNumber,
            orderNumber: o.orderNumber,
            token: o.token || (o.orderNumber ? `P-${o.orderNumber.replace(/[^0-9]/g, '').slice(-2)}` : 'P-01'),
            customerName: o.customerName || 'Customer',
            customerPhone: o.customerPhone || '',
            scheduledDate: o.date || 'Today',
            scheduledTimeRange: o.time || '11:00 AM – 11:30 AM',
            dayCategory: 'TODAY',
            items,
            totalPaise: (o.amount || 0) * 100,
            status: st,
            paymentMode: o.paymentMode || 'UPI (Advance Confirmed)'
          };
        });

        this.preorders.set(mapped);
        this.isLoading.set(false);
      },
      error: () => {
        this.preorders.set([]);
        this.isLoading.set(false);
      }
    });
  }

  // KPIs
  readonly totalValuePaise = computed(() =>
    this.preorders().reduce((acc, o) => acc + o.totalPaise, 0)
  );

  // Filtered List
  readonly filteredPreorders = computed(() => {
    const d = this.filterDate();
    const s = this.filterStatus();
    const q = this.searchQuery().toLowerCase().trim();

    return this.preorders().filter(o => {
      const matchDate = d === 'ALL' || o.dayCategory === d;
      const matchStatus = s === 'ALL' || o.status === s;
      const matchSearch = !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q);

      return matchDate && matchStatus && matchSearch;
    });
  });

  setDateFilter(d: 'ALL' | 'TODAY' | 'TOMORROW' | 'WEEKEND') {
    this.filterDate.set(d);
  }

  setStatusFilter(s: 'ALL' | 'CONFIRMED' | 'IN_PREPARATION' | 'READY_FOR_PICKUP' | 'COLLECTED') {
    this.filterStatus.set(s);
  }

  advanceOrderStatus(orderId: string) {
    const current = this.preorders().find(o => o.id === orderId);
    if (!current) return;

    let nextBackendStatus: 'New' | 'Preparing' | 'Ready' | 'Completed' = 'Preparing';
    let nextStatus: MerchantPreorder['status'] = 'IN_PREPARATION';

    if (current.status === 'CONFIRMED') {
      nextBackendStatus = 'Preparing';
      nextStatus = 'IN_PREPARATION';
    } else if (current.status === 'IN_PREPARATION') {
      nextBackendStatus = 'Ready';
      nextStatus = 'READY_FOR_PICKUP';
    } else if (current.status === 'READY_FOR_PICKUP') {
      nextBackendStatus = 'Completed';
      nextStatus = 'COLLECTED';
    }

    this.orderApi.updateOrderStatus(orderId, nextBackendStatus).subscribe({
      next: () => {
        this.preorders.update(list =>
          list.map(o => o.id === orderId ? { ...o, status: nextStatus } : o)
        );
        this.showToast(`Order ${current.orderNumber} advanced to ${nextStatus.replace(/_/g, ' ')}!`);
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Failed to advance order status');
      }
    });
  }

  private showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 2800);
  }
}
