import { Component, signal, computed, ChangeDetectionStrategy, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { OrderInboxApi } from '../../order-inbox/data-access/order-inbox.api';
import { MerchantAuthStore } from '../../../core/auth/merchant-auth.store';

export interface QueueOrder {
  id: string;
  token: string;
  customerName: string;
  type: 'Walk-in' | 'Online' | 'Table QR';
  fulfilmentType: 'Home Delivery' | 'Self Pickup';
  itemsSummary: string;
  itemsCount: number;
  amount: number;
  status: 'Preparing' | 'Ready' | 'Called' | 'OutForDelivery';
  timeRemainingMins: number;
  placedTime: string;
}

@Component({
  selector: 'merchant-queue-board-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './queue-board-list.page.html',
  styleUrls: ['./queue-board-list.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QueueBoardPageComponent implements OnInit, OnDestroy {
  private orderApi = inject(OrderInboxApi);
  private authStore = inject(MerchantAuthStore);
  private sub = new Subscription();

  // View mode: 'kanban' | 'list'
  readonly viewLayout = signal<'kanban' | 'list'>('kanban');

  // Filter: 'All' | 'Walk-in' | 'Online' | 'Table QR'
  readonly activeTypeFilter = signal<'All' | 'Walk-in' | 'Online' | 'Table QR'>('All');

  // Fullscreen state
  readonly isFullscreen = signal<boolean>(false);

  // Toast announcement
  readonly announcementToast = signal<string | null>(null);

  // Queue Orders (real-time live orders for the active tenant)
  readonly queueList = signal<QueueOrder[]>([]);
  readonly isLoading = signal<boolean>(false);

  // Metrics
  readonly inQueueCount = computed(() => this.queueList().length);
  readonly preparingCount = computed(() => this.queueList().filter(q => q.status === 'Preparing').length);
  readonly readyCount = computed(() => this.queueList().filter(q => q.status === 'Ready' || q.status === 'Called').length);
  readonly completedToday = signal<number>(0);

  ngOnInit(): void {
    this.loadQueueOrders();
    this.sub.add(
      this.authStore.tenantSwitched$.subscribe(() => {
        this.loadQueueOrders();
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadQueueOrders(): void {
    this.isLoading.set(true);
    this.orderApi.fetchOrders().subscribe({
      next: (res) => {
        const live = res.liveOrders || [];
        const mapped: QueueOrder[] = live.map((o: any) => {
          let orderType: 'Walk-in' | 'Online' | 'Table QR' = 'Online';
          if (o.fulfilmentType === 'Self Pickup') orderType = 'Walk-in';
          else if (o.fulfilmentType === 'Table QR') orderType = 'Table QR';

          const itemsText = o.items && o.items.length > 0
            ? o.items.map((i: any) => `${i.quantity || 1}x ${i.name || i.title || i.productName || 'Item'}`).join(', ')
            : `${o.itemsCount || 1} Items`;

          const resolvedAmount = o.amount ?? o.totalAmount ?? (o.totalAmountPaise != null ? Math.round(Number(o.totalAmountPaise) / 100) : 0);

          const isPickup = String(o.fulfilmentType || o.fulfillmentType || '').toUpperCase().includes('PICKUP') ||
            String(o.fulfillmentType || '').toUpperCase() === 'WALK_IN';
          const rawSt = String(o.status || '').toUpperCase();
          const queueStatus: QueueOrder['status'] =
            rawSt === 'OUT_FOR_DELIVERY'
              ? 'OutForDelivery'
              : rawSt.includes('READY')
                ? 'Ready'
                : 'Preparing';

          return {
            id: o.id || o.orderNumber,
            token: o.token || (o.orderNumber ? o.orderNumber.replace(/[^0-9]/g, '').slice(-3) : 'Q-01'),
            customerName: o.customerName || o.customer?.name || 'Online Customer',
            type: orderType,
            fulfilmentType: isPickup ? 'Self Pickup' : 'Home Delivery',
            itemsSummary: itemsText,
            itemsCount: o.itemsCount || (Array.isArray(o.items) ? o.items.length : 1),
            amount: resolvedAmount,
            status: queueStatus,
            timeRemainingMins: queueStatus === 'Preparing' ? 8 : 0,
            placedTime: o.time || 'Today'
          };
        });

        this.queueList.set(mapped);
        this.completedToday.set(res.summary?.completed || 0);
        this.isLoading.set(false);
      },
      error: () => {
        this.queueList.set([]);
        this.isLoading.set(false);
      }
    });
  }

  // Filtered List
  readonly filteredQueue = computed(() => {
    const f = this.activeTypeFilter();
    if (f === 'All') return this.queueList();
    return this.queueList().filter(q => q.type === f);
  });

  readonly preparingOrders = computed(() =>
    this.filteredQueue().filter(q => q.status === 'Preparing')
  );

  readonly readyOrders = computed(() =>
    this.filteredQueue().filter(q => q.status === 'Ready' || q.status === 'Called' || q.status === 'OutForDelivery')
  );

  callNextToken() {
    const nextReady = this.queueList().find(q => q.status === 'Ready');
    if (nextReady) {
      this.callToken(nextReady.token);
    } else {
      const nextPrep = this.queueList().find(q => q.status === 'Preparing');
      if (nextPrep) {
        this.markReady(nextPrep.id);
        this.callToken(nextPrep.token);
      } else {
        this.showToast('No orders waiting to be called!');
      }
    }
  }

  callToken(token: string) {
    this.queueList.update(list =>
      list.map(q => q.token === token ? { ...q, status: 'Called' } : q)
    );
    this.showToast(`📢 Calling Token ${token}! Please collect your order at counter.`);
  }

  markReady(id: string) {
    this.orderApi.updateOrderStatus(id, 'Ready').subscribe({
      next: () => {
        this.queueList.update(list =>
          list.map(q => q.id === id ? { ...q, status: 'Ready', timeRemainingMins: 0 } : q)
        );
        this.showToast(`Order marked Ready for Pickup!`);
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Failed to update order status');
      }
    });
  }

  dispatchForDelivery(id: string) {
    this.orderApi.updateOrderStatus(id, 'OUT_FOR_DELIVERY').subscribe({
      next: () => {
        this.queueList.update(list =>
          list.map(q => q.id === id ? { ...q, status: 'OutForDelivery', timeRemainingMins: 0 } : q)
        );
        this.showToast(`Order dispatched — Out for Delivery!`);
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Failed to dispatch order');
      }
    });
  }

  completeOrder(id: string) {
    this.orderApi.updateOrderStatus(id, 'Completed').subscribe({
      next: () => {
        this.queueList.update(list => list.filter(q => q.id !== id));
        this.completedToday.update(c => c + 1);
        this.showToast(`Order delivered & completed!`);
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Failed to complete order');
      }
    });
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      this.isFullscreen.set(true);
    } else {
      document.exitFullscreen().catch(() => {});
      this.isFullscreen.set(false);
    }
  }

  private showToast(msg: string) {
    this.announcementToast.set(msg);
    setTimeout(() => this.announcementToast.set(null), 3200);
  }
}

export { QueueBoardPageComponent as QueueBoardListPageComponent };
