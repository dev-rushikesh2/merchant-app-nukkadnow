import { Routes } from '@angular/router';
import { merchantAuthGuard } from './core/auth/merchant-auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', canActivate: [merchantAuthGuard], loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES) },
  { path: 'order-inbox', canActivate: [merchantAuthGuard], loadChildren: () => import('./features/order-inbox/order-inbox.routes').then(m => m.ORDER_INBOX_ROUTES) },
  { path: 'walkin-orders', canActivate: [merchantAuthGuard], loadChildren: () => import('./features/walkin-orders/walkin-orders.routes').then(m => m.WALKIN_ORDERS_ROUTES) },
  { path: 'queue-board', canActivate: [merchantAuthGuard], loadChildren: () => import('./features/queue-board/queue-board.routes').then(m => m.QUEUE_BOARD_ROUTES) },
  { path: 'catalogue', canActivate: [merchantAuthGuard], loadChildren: () => import('./features/catalogue/catalogue.routes').then(m => m.CATALOGUE_ROUTES) },
  { path: 'variants', canActivate: [merchantAuthGuard], loadChildren: () => import('./features/variants/variants.routes').then(m => m.VARIANTS_ROUTES) },
  { path: 'inventory', canActivate: [merchantAuthGuard], loadChildren: () => import('./features/inventory/inventory.routes').then(m => m.INVENTORY_ROUTES) },
  { path: 'preorders', canActivate: [merchantAuthGuard], loadChildren: () => import('./features/preorders/preorders.routes').then(m => m.PREORDERS_ROUTES) },
  { path: 'batches', canActivate: [merchantAuthGuard], loadChildren: () => import('./features/batches/batches.routes').then(m => m.BATCHES_ROUTES) },
  { path: 'capacity-settings', canActivate: [merchantAuthGuard], loadChildren: () => import('./features/capacity-settings/capacity-settings.routes').then(m => m.CAPACITY_SETTINGS_ROUTES) },
  { path: 'pickup-slots', canActivate: [merchantAuthGuard], loadChildren: () => import('./features/pickup-slots/pickup-slots.routes').then(m => m.PICKUP_SLOTS_ROUTES) },
  { path: 'qr-ordering', canActivate: [merchantAuthGuard], loadChildren: () => import('./features/qr-ordering/qr-ordering.routes').then(m => m.QR_ORDERING_ROUTES) },
  { path: 'delivery-settings', canActivate: [merchantAuthGuard], loadChildren: () => import('./features/delivery-settings/delivery-settings.routes').then(m => m.DELIVERY_SETTINGS_ROUTES) },
  { path: 'staff-access', canActivate: [merchantAuthGuard], loadChildren: () => import('./features/staff-access/staff-access.routes').then(m => m.STAFF_ACCESS_ROUTES) },
  { path: 'outlets', canActivate: [merchantAuthGuard], loadChildren: () => import('./features/outlets/outlets.routes').then(m => m.OUTLETS_ROUTES) },
  { path: 'seller-modes', canActivate: [merchantAuthGuard], loadChildren: () => import('./features/seller-modes/seller-modes.routes').then(m => m.SELLER_MODES_ROUTES) },
  { path: 'business-profile', canActivate: [merchantAuthGuard], loadChildren: () => import('./features/business-profile/business-profile.routes').then(m => m.BUSINESS_PROFILE_ROUTES) },
  { path: 'subscriptions', canActivate: [merchantAuthGuard], loadChildren: () => import('./features/subscriptions/subscriptions.routes').then(m => m.SUBSCRIPTIONS_ROUTES) },
  { path: 'billing', canActivate: [merchantAuthGuard], loadChildren: () => import('./features/billing/billing.routes').then(m => m.BILLING_ROUTES) },
  { path: 'analytics', canActivate: [merchantAuthGuard], loadChildren: () => import('./features/analytics/analytics.routes').then(m => m.ANALYTICS_ROUTES) },
  { path: 'notifications', canActivate: [merchantAuthGuard], loadChildren: () => import('./features/notifications/notifications.routes').then(m => m.NOTIFICATIONS_ROUTES) },
  { path: 'settings', canActivate: [merchantAuthGuard], loadChildren: () => import('./features/settings/settings.routes').then(m => m.SETTINGS_ROUTES) },
  { path: 'onboarding', loadChildren: () => import('./features/onboarding/onboarding.routes').then(m => m.ONBOARDING_ROUTES) },
  { path: 'auth', loadChildren: () => import('./features/authentication/authentication.routes').then(m => m.AUTHENTICATION_ROUTES) },
  { path: '**', redirectTo: 'dashboard' }
];
