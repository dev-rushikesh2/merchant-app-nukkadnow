import { Injectable, inject } from '@angular/core';
import { HttpClientAdapter } from '@nukkadnow/api-client';
import { Observable } from 'rxjs';

export interface DashboardApiResponse {
  shopName: string;
  greeting: string;
  selectedTimeframe: string;
  performance: {
    sales: number;
    orders: number;
    customers: number;
    growthPercent: number;
  };
  recentOrders: Array<{
    id: string;
    time: string;
    amount: number;
    status: 'New' | 'Preparing' | 'Ready' | 'Completed';
    color: 'green' | 'blue' | 'purple';
    customerName: string;
    itemsCount: number;
  }>;
  topProduct: string;
  activeArea: string;
  rating: { score: number; count: number };
  todayRevenuePaise: number;
  activeOrdersCount: number;
  pendingPickupCount: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly http = inject(HttpClientAdapter);
  private readonly baseUrl = '/api/v1/merchant/dashboard';

  fetchDashboardSummary(): Observable<DashboardApiResponse> {
    return this.http.get<DashboardApiResponse>(this.baseUrl);
  }

  fetchList(): Observable<DashboardApiResponse> {
    return this.fetchDashboardSummary();
  }
}
