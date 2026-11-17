import { Injectable, inject } from '@angular/core';
import { HttpClientAdapter } from '@nukkadnow/api-client';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { InventoryItem, StockMovementRecord, INITIAL_INVENTORY, INITIAL_MOVEMENTS } from '../models/inventory-view.model';

@Injectable({ providedIn: 'root' })
export class InventoryApi {
  private http = inject(HttpClientAdapter);
  private readonly baseUrl = '/api/v1/merchant/inventory';

  fetchInventory(outletId = 'outlet-main'): Observable<InventoryItem[]> {
    return this.http.get<any[]>(this.baseUrl, { outletId }).pipe(
      map(items => {
        if (!items || items.length === 0) return INITIAL_INVENTORY;
        return items.flatMap(prod =>
          (prod.variants || []).map((v: any) => ({
            id: v.id,
            productId: prod.id,
            title: prod.name + (prod.variants?.length > 1 ? ` (${v.name})` : ''),
            category: prod.category || 'General',
            currentStock: v.availableStock ?? v.onHandStock ?? 0,
            lowStockThreshold: 10,
            unit: 'units',
            isLowStock: (v.availableStock ?? 0) <= 10,
            inStock: (v.availableStock ?? 0) > 0,
            lastUpdated: 'Live from Server',
          }))
        );
      }),
      catchError(err => {
        console.warn('Inventory API offline or unreachable, falling back to local state:', err);
        return of(INITIAL_INVENTORY);
      })
    );
  }

  adjustStock(payload: {
    variantId: string;
    outletId: string;
    quantityChange: number;
    reason: string;
    notes?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/adjust`, payload).pipe(
      catchError(err => {
        console.warn('adjustStock server call failed, local optimistic update maintained:', err);
        return of({ success: true, localOnly: true });
      })
    );
  }

  fetchMovements(outletId = 'outlet-main', limit = 50): Observable<StockMovementRecord[]> {
    return this.http.get<any[]>(`${this.baseUrl}/movements`, { outletId, limit }).pipe(
      map(records => {
        if (!records || records.length === 0) return INITIAL_MOVEMENTS;
        return records.map((r: any) => ({
          id: r.id,
          productId: r.referenceId || r.variantId,
          productTitle: `Variant ${r.variantId.slice(-6)}`,
          delta: r.quantityChange,
          previousStock: r.balanceAfter - r.quantityChange,
          newStock: r.balanceAfter,
          reason: r.reason,
          note: r.notes,
          actorName: r.actorId,
          timestamp: new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
      }),
      catchError(() => of(INITIAL_MOVEMENTS))
    );
  }

  fetchList(): Observable<any[]> {
    return this.fetchInventory();
  }
}
