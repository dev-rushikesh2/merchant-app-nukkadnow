export type StockAdjustmentReason = 'RESTOCK' | 'CORRECTION' | 'DAMAGE' | 'SPOILAGE' | 'RETURN';

export interface InventoryItem {
  id: string;
  productId: string;
  title: string;
  category: string;
  currentStock: number;
  lowStockThreshold: number;
  unit: string;
  isLowStock: boolean;
  inStock: boolean;
  lastUpdated: string;
}

export interface StockMovementRecord {
  id: string;
  productId: string;
  productTitle: string;
  delta: number;
  previousStock: number;
  newStock: number;
  reason: StockAdjustmentReason;
  note?: string;
  actorName: string;
  timestamp: string;
}

export type InventoryViewModel = any;
