import { Injectable, signal, inject } from '@angular/core';
import { SubscriptionDetails, SaaSTier } from '../models/subscriptions-view.model';
import { MerchantAuthStore } from '../../../core/auth/merchant-auth.store';

const DEFAULT_SUBSCRIPTION: SubscriptionDetails = {
  currentTier: 'PRO',
  billingCycle: 'MONTHLY',
  pricePaise: 99900,
  nextRenewalDate: '2026-12-15',
  isInGracePeriod: false,
  gracePeriodDaysRemaining: 7,
  quotas: {
    outletsUsed: 1,
    outletsLimit: 1,
    staffUsed: 2,
    staffLimit: 5,
    productsUsed: 12,
    productsLimit: 9999,
    ordersThisMonth: 124,
    ordersLimit: 9999
  }
};

@Injectable()
export class SubscriptionsStore {
  private authStore = inject(MerchantAuthStore);

  readonly subscription = signal<SubscriptionDetails>(DEFAULT_SUBSCRIPTION);
  readonly isUpgrading = signal<boolean>(false);
  readonly upgradeSuccess = signal<string | null>(null);

  upgradeTier(tier: SaaSTier): void {
    this.isUpgrading.set(true);
    setTimeout(() => {
      let price = 0;
      let outlets = 1;
      let staff = 2;
      let products = 50;

      if (tier === 'PRO') {
        price = 99900;
        outlets = 1;
        staff = 5;
        products = 9999;
      } else if (tier === 'MULTI_OUTLET') {
        price = 249900;
        outlets = 5;
        staff = 9999;
        products = 9999;
      }

      this.subscription.update(sub => ({
        ...sub,
        currentTier: tier,
        pricePaise: price,
        quotas: {
          ...sub.quotas,
          outletsLimit: outlets,
          staffLimit: staff,
          productsLimit: products
        }
      }));

      this.isUpgrading.set(false);
      this.upgradeSuccess.set(`Successfully upgraded to ${tier} Plan!`);
      setTimeout(() => this.upgradeSuccess.set(null), 3500);
    }, 700);
  }
}
