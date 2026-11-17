export interface ProductVariant {
  id: string;
  name: string; // e.g. "500g", "1kg", "Small"
  pricePaise: number;
  stockCount: number;
}

export interface ProductItem {
  id: string;
  outletId: string;
  title: string;
  description: string;
  category: string;
  pricePaise: number;
  compareAtPricePaise?: number;
  inStock: boolean;
  stockCount: number;
  isVeg: boolean;
  isMadeToOrder: boolean;
  leadTimeMinutes?: number;
  dailyOrderLimit?: number;
  imageUrl?: string;
  variants: ProductVariant[];
}

export type CatalogueViewModel = any;
