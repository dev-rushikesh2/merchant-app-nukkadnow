import { Injectable, inject } from '@angular/core';
import { HttpClientAdapter } from '@nukkadnow/api-client';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { OrderInboxItem } from '../models/order-inbox-view.model';

export interface OrderApiResponse {
  success: boolean;
  data: any[];
  liveOrders?: any[];
  pastOrders?: any[];
  summary?: {
    total: number;
    new: number;
    preparing: number;
    ready: number;
    completed: number;
  };
}

@Injectable({ providedIn: 'root' })
export class OrderInboxApi {
  private readonly http = inject(HttpClientAdapter);
  private readonly baseUrl = '/api/v1/merchant/orders';

  fetchOrders(params?: { status?: string; subTab?: string; q?: string }): Observable<OrderApiResponse> {
    return this.http.get<OrderApiResponse>(this.baseUrl, params);
  }

  fetchList(params?: any): Observable<OrderApiResponse> {
    return this.fetchOrders(params);
  }

  updateOrderStatus(orderId: string, status: 'New' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled', prepMinutes?: number): Observable<any> {
    const cleanId = encodeURIComponent(orderId.replace('#', ''));
    return this.http.patch<any>(`${this.baseUrl}/${cleanId}/status`, { status, prepMinutes });
  }

  getOrderDetails(orderId: string): Observable<any> {
    const cleanId = encodeURIComponent(orderId.replace('#', ''));
    return this.http.get<any>(`${this.baseUrl}/${cleanId}`);
  }

  createWalkinOrder(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/walkin`, payload);
  }
}
