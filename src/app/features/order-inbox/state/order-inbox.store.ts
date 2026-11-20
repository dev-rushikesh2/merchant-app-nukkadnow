import { Injectable, signal, computed, inject } from '@angular/core';
import { OrderInboxItem, OrderLifecycleState } from '../models/order-inbox-view.model';
import { AudioAlertService } from '../../../core/realtime/audio-alert.service';
import { MerchantRealtimeService } from '../../../core/realtime/merchant-realtime.service';
import { OrderInboxApi } from '../data-access/order-inbox.api';

@Injectable({ providedIn: 'root' })
export class OrderInboxStore {
  private audio = inject(AudioAlertService);
  private realtime = inject(MerchantRealtimeService);
  private api = inject(OrderInboxApi);

  readonly orders = signal<OrderInboxItem[]>([]);
  readonly activeTab = signal<'NEW' | 'PREPARING' | 'READY' | 'COMPLETED'>('NEW');
  readonly isSoundEnabled = signal<boolean>(true);
  readonly loading = signal<boolean>(false);
  readonly transitionError = signal<string | null>(null);

  readonly newOrdersCount = computed(() => this.orders().filter((o) => o.status === 'PLACED').length);
  readonly preparingCount = computed(() => this.orders().filter((o) => o.status === 'PREPARING').length);
  readonly readyCount = computed(() => this.orders().filter((o) => o.status === 'READY').length);
  readonly completedCount = computed(() => this.orders().filter((o) => o.status === 'COMPLETED').length);

  readonly visibleOrders = computed(() => {
    const tab = this.activeTab();
    return this.orders().filter((o) => {
      if (tab === 'NEW') return o.status === 'PLACED';
      if (tab === 'PREPARING') return o.status === 'PREPARING';
      if (tab === 'READY') return o.status === 'READY';
      if (tab === 'COMPLETED') return o.status === 'COMPLETED';
      return true;
    });
  });

  constructor() {
    this.load();
    this.initRealtimeStream();
  }

  private initRealtimeStream(): void {
    try {
      const outletId = localStorage.getItem('nk_active_outlet_id') || 'outlet-main';
      this.realtime.connectOrderInbox(outletId).subscribe({
        next: (event: any) => {
          if (event?.type === 'order.created' && event.data) {
            const newOrder = event.data;
            this.orders.update((list) => [newOrder, ...list]);
            if (this.isSoundEnabled()) {
              this.realtime.notifyNewOrder();
            }
          } else if (event?.type === 'order.status.updated' && event.data) {
            this.orders.update((list) =>
              list.map((o) => (o.id === event.data.id ? { ...o, status: event.data.status } : o))
            );
          }
        },
        error: () => {
          // Realtime disconnected, will reconnect on next poll
        }
      });
    } catch {
      // Standalone/offline
    }
  }

  load(): void {
    this.loading.set(true);
    this.api.fetchOrders().subscribe({
      next: (res) => {
        if (res?.data) {
          const items: OrderInboxItem[] = res.data.map((o: any) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            customerName: o.customerName,
            customerPhoneMasked: o.customerPhone ? o.customerPhone.slice(0, 7) + '*****' : '+91 98*** *****',
            source: 'MARKETPLACE',
            status: (o.status === 'New' ? 'PLACED' : o.status.toUpperCase()) as OrderLifecycleState,
            fulfillmentType: o.fulfilmentType === 'Home Delivery' ? 'MERCHANT_DELIVERY' : 'PICKUP',
            pickupSlotTime: o.time,
            itemsSummary: (o.items || []).map((i: any) => `${i.quantity}x ${i.name}`).join(', ') || `${o.itemsCount} items`,
            items: (o.items || []).map((i: any) => ({
              title: i.name,
              quantity: i.quantity,
              pricePaise: (i.price || 0) * 100,
              notes: i.meta
            })),
            totalPaise: (o.amount || 0) * 100,
            receivedAgo: o.time
          }));
          this.orders.set(items);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setTab(tab: 'NEW' | 'PREPARING' | 'READY' | 'COMPLETED') {
    this.activeTab.set(tab);
  }

  toggleSound() {
    this.isSoundEnabled.update((v) => !v);
  }

  acceptOrder(orderId: string, prepMinutes: number) {
    const previousSnapshot = [...this.orders()];
    this.transitionError.set(null);

    // Optimistic update
    this.orders.update((list) =>
      list.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'PREPARING' as OrderLifecycleState,
              prepMinutes,
              countdownMinutes: prepMinutes
            }
          : o
      )
    );

    this.api.updateOrderStatus(orderId, 'Preparing', prepMinutes).subscribe({
      error: (err) => {
        // Rollback snapshot on API failure (Fix H-01)
        this.orders.set(previousSnapshot);
        this.transitionError.set(err?.error?.message || `Failed to accept order ${orderId}. Reverted to previous state.`);
      }
    });
  }

  rejectOrder(orderId: string, reason: string) {
    const previousSnapshot = [...this.orders()];
    this.transitionError.set(null);

    // Optimistic update
    this.orders.update((list) =>
      list.map((o) =>
        o.id === orderId ? { ...o, status: 'REJECTED' as OrderLifecycleState } : o
      )
    );

    this.api.updateOrderStatus(orderId, 'Cancelled').subscribe({
      error: (err) => {
        // Rollback snapshot on API failure (Fix H-01)
        this.orders.set(previousSnapshot);
        this.transitionError.set(err?.error?.message || `Failed to reject order ${orderId}. Reverted to previous state.`);
      }
    });
  }

  markReady(orderId: string) {
    const previousSnapshot = [...this.orders()];
    this.transitionError.set(null);

    // Optimistic update
    this.orders.update((list) =>
      list.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'READY' as OrderLifecycleState,
              countdownMinutes: 0
            }
          : o
      )
    );

    this.api.updateOrderStatus(orderId, 'Ready').subscribe({
      error: (err) => {
        // Rollback snapshot on API failure (Fix H-01)
        this.orders.set(previousSnapshot);
        this.transitionError.set(err?.error?.message || `Failed to mark order ${orderId} ready. Reverted to previous state.`);
      }
    });
  }

  completeOrder(orderId: string) {
    const previousSnapshot = [...this.orders()];
    this.transitionError.set(null);

    // Optimistic update
    this.orders.update((list) =>
      list.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'COMPLETED' as OrderLifecycleState
            }
          : o
      )
    );

    this.api.updateOrderStatus(orderId, 'Completed').subscribe({
      error: (err) => {
        // Rollback snapshot on API failure (Fix H-01)
        this.orders.set(previousSnapshot);
        this.transitionError.set(err?.error?.message || `Failed to complete order ${orderId}. Reverted to previous state.`);
      }
    });
  }
}
