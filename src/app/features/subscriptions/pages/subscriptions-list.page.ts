import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionsStore } from '../state/subscriptions.store';
import { SaaSTier } from '../models/subscriptions-view.model';

@Component({
  selector: 'merchant-subscriptions-list-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscriptions-list.page.html',
  styleUrls: ['./subscriptions-list.page.scss'],
  providers: [SubscriptionsStore],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubscriptionsListPageComponent {
  readonly store = inject(SubscriptionsStore);

  // Billing cycle toggle: 'MONTHLY' | 'ANNUAL' (save 20%)
  readonly billingCycle = signal<'MONTHLY' | 'ANNUAL'>('MONTHLY');

  setBillingCycle(cycle: 'MONTHLY' | 'ANNUAL'): void {
    this.billingCycle.set(cycle);
  }

  upgrade(tier: SaaSTier): void {
    this.store.upgradeTier(tier);
  }

  formatPrice(paise: number): string {
    if (paise === 0) return 'Free';
    return '₹' + (paise / 100).toLocaleString('en-IN') + ' / mo';
  }

  getPlanDisplayPrice(tier: SaaSTier): string {
    const isAnnual = this.billingCycle() === 'ANNUAL';
    if (tier === 'STARTER') return '₹0';
    if (tier === 'PRO') return isAnnual ? '₹799' : '₹999';
    if (tier === 'MULTI_OUTLET') return isAnnual ? '₹1,999' : '₹2,499';
    return '₹0';
  }

  getAnnualSavingsLabel(tier: SaaSTier): string | null {
    if (this.billingCycle() !== 'ANNUAL') return null;
    if (tier === 'PRO') return 'Save ₹2,400 / year';
    if (tier === 'MULTI_OUTLET') return 'Save ₹6,000 / year';
    return null;
  }

  getMeterPercent(used: number, limit: number): number {
    if (limit >= 9999) return Math.min(100, Math.round((used / 100) * 100));
    return Math.min(100, Math.round((used / limit) * 100));
  }
}
