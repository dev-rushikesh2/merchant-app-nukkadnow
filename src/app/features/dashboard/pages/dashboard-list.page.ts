import { Component, inject, signal, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MerchantShellComponent } from '../../../layout/merchant-shell/merchant-shell.component';
import { OutletSwitcherStore } from '../../../core/outlet-context/outlet-switcher.store';
import { DashboardApi, DashboardApiResponse } from '../data-access/dashboard.api';
import { MerchantAuthStore } from '../../../core/auth/merchant-auth.store';
import { Subscription } from 'rxjs';

export interface DashboardMetric {
  label: string;
  value: string;
  icon: string;
  subtext: string;
}

export interface RecentOrderSummary {
  id: string;
  time: string;
  amount: number;
  status: 'New' | 'Preparing' | 'Ready' | 'Completed';
  color: 'green' | 'blue' | 'purple';
  customerName?: string;
  itemsCount?: number;
}

@Component({
  selector: 'merchant-dashboard-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MerchantShellComponent],
  templateUrl: './dashboard-list.page.html',
  styleUrls: ['./dashboard-list.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardListPageComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  readonly outletStore = inject(OutletSwitcherStore);
  private dashboardApi = inject(DashboardApi);
  readonly authStore = inject(MerchantAuthStore);
  private sub = new Subscription();

  // Loading state
  readonly isLoading = signal<boolean>(true);

  // Shop Info
  readonly shopName = signal<string>('');
  readonly greeting = signal<string>('Good Morning');
  readonly selectedTimeframe = signal<string>('Today');

  // Performance Metrics
  readonly performance = signal({
    sales: 0,
    orders: 0,
    customers: 0,
    growthPercent: 0
  });

  // Recent Orders
  readonly recentOrders = signal<RecentOrderSummary[]>([]);

  // Quick Insights
  readonly topProduct = signal<string>('Loading...');
  readonly activeArea = signal<string>('Within 10 km');
  readonly rating = signal<{ score: number; count: number }>({ score: 4.8, count: 0 });

  ngOnInit(): void {
    this.loadDashboard();

    // Reload whenever user switches active merchant tenant in header
    this.sub.add(
      this.authStore.tenantSwitched$.subscribe(() => {
        this.loadDashboard();
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.dashboardApi.fetchDashboardSummary().subscribe({
      next: (data: DashboardApiResponse) => {
        if (data) {
          this.shopName.set(data.shopName || this.authStore.activeMerchant()?.merchantName || '');
          this.greeting.set(data.greeting || 'Good Day');
          this.selectedTimeframe.set(data.selectedTimeframe || 'Today');
          this.performance.set(data.performance || { sales: 0, orders: 0, customers: 0, growthPercent: 0 });
          this.recentOrders.set(data.recentOrders || []);
          this.topProduct.set(data.topProduct || 'Daily Fresh Products');
          this.activeArea.set(data.activeArea || 'Within 10 km');
          this.rating.set(data.rating || { score: 4.8, count: 50 });
        }
        this.isLoading.set(false);
      },
      error: () => {
        // Fallback to active tenant identity if network unavailable
        const active = this.authStore.activeMerchant();
        this.shopName.set(active?.merchantName ?? '');
        this.isLoading.set(false);
      }
    });
  }

  openOrderDetails(orderId: string) {
    this.router.navigate(['/order-inbox'], { queryParams: { orderId } });
  }

  setTimeframe(tf: string) {
    this.selectedTimeframe.set(tf);
  }
}
