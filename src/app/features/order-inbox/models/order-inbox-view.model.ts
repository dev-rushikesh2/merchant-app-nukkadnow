export type OrderSource = 'MARKETPLACE' | 'WALKIN' | 'QR';
export type OrderLifecycleState = 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'COMPLETED' | 'REJECTED';

export interface OrderItemDetail {
  title: string;
  quantity: number;
  pricePaise: number;
  notes?: string;
}

export interface OrderInboxItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhoneMasked: string;
  source: OrderSource;
  status: OrderLifecycleState;
  fulfillmentType: 'PICKUP' | 'MERCHANT_DELIVERY';
  pickupSlotTime?: string;
  itemsSummary: string;
  items: OrderItemDetail[];
  totalPaise: number;
  receivedAgo: string;
  prepMinutes?: number;
  countdownMinutes?: number;
}

export type OrderInboxViewModel = any;
