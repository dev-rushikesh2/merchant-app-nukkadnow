import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface QueuedOfflineAction {
  id: string;
  type: 'DRAFT_WALKIN_ORDER' | 'UPDATE_LOCAL_STOCK';
  payload: any;
  timestamp: number;
  synced: boolean;
  retryCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NetworkSyncService {
  private readonly http = inject(HttpClient);

  readonly isOnline = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  readonly queuedActions = signal<QueuedOfflineAction[]>([]);
  readonly isSyncing = signal<boolean>(false);
  readonly lastSyncTimestamp = signal<string>('Just now');

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline.set(true);
        this.syncQueue();
      });
      window.addEventListener('offline', () => {
        this.isOnline.set(false);
      });
    }
  }

  queueAction(action: Omit<QueuedOfflineAction, 'id' | 'timestamp' | 'synced'>): void {
    const item: QueuedOfflineAction = {
      ...action,
      id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      synced: false,
      retryCount: 0
    };
    this.queuedActions.update(q => [...q, item]);
  }

  async syncQueue(): Promise<void> {
    const actions = this.queuedActions();
    if (actions.length === 0 || this.isSyncing()) return;

    this.isSyncing.set(true);
    const remaining: QueuedOfflineAction[] = [];

    for (const action of actions) {
      try {
        if (action.type === 'DRAFT_WALKIN_ORDER') {
          await this.http.post(`${environment.apiGatewayUrl}/merchant/orders/walkin`, action.payload).toPromise();
        } else if (action.type === 'UPDATE_LOCAL_STOCK') {
          await this.http.post(`${environment.apiGatewayUrl}/merchant/inventory/adjust`, action.payload).toPromise();
        }
        // Successfully synced, omitted from remaining
      } catch (err) {
        // Failed: preserve in queue with incremented retry count
        remaining.push({
          ...action,
          retryCount: (action.retryCount || 0) + 1
        });
      }
    }

    this.queuedActions.set(remaining);
    this.isSyncing.set(false);
    this.lastSyncTimestamp.set(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }
}
