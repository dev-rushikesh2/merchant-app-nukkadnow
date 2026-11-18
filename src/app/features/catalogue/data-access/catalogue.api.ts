import { Injectable, inject } from '@angular/core';
import { HttpClientAdapter } from '@nukkadnow/api-client';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ProductItem } from '../models/catalogue-view.model';

@Injectable({ providedIn: 'root' })
export class CatalogueApi {
  private http = inject(HttpClientAdapter);
  private readonly baseUrl = '/api/v1/merchant/catalog/products';

  fetchProducts(outletId?: string): Observable<ProductItem[]> {
    const params: Record<string, string> = {};
    if (outletId && outletId !== 'outlet-main') {
      params['outletId'] = outletId;
    }
    return this.http.get<any[]>(this.baseUrl, Object.keys(params).length > 0 ? params : undefined).pipe(
      map(items => {
        if (!items || items.length === 0) return [];
        return items.map((p: any) => ({
          id: p.id,
          outletId: p.outletId,
          title: p.name,
          description: p.description || '',
          category: p.category || 'General',
          pricePaise: p.variants?.[0]?.pricePaise ?? 0,
          compareAtPricePaise: p.variants?.[0]?.compareAtPricePaise,
          inStock: p.variants?.[0]?.availableStock > 0,
          stockCount: p.variants?.[0]?.availableStock ?? 0,
          isVeg: true,
          isMadeToOrder: p.variants?.[0]?.isPreorder ?? false,
          leadTimeMinutes: p.variants?.[0]?.leadTimeMinutes,
          imageUrl: '',
          variants: (p.variants || []).map((v: any) => ({
            id: v.id,
            name: v.name,
            pricePaise: v.pricePaise,
            stockCount: v.availableStock ?? 0,
          })),
        }));
      }),
      catchError(err => {
        console.warn('Catalog API error or unreachable:', err);
        return of([]);
      })
    );
  }

  createProduct(product: ProductItem): Observable<any> {
    const payload = {
      name: product.title,
      description: product.description,
      category: product.category,
      outletId: product.outletId,
      variants: product.variants.length > 0
        ? product.variants.map(v => ({
            name: v.name,
            pricePaise: v.pricePaise,
            compareAtPricePaise: product.compareAtPricePaise,
            initialStock: v.stockCount || 10,
          }))
        : [
            {
              name: 'Standard',
              pricePaise: product.pricePaise,
              compareAtPricePaise: product.compareAtPricePaise,
              initialStock: product.stockCount || 10,
            },
          ],
    };

    return this.http.post<any>(this.baseUrl, payload);
  }

  updatePricing(productId: string, payload: { variantId: string; pricePaise: number }): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${productId}/pricing`, payload);
  }

  fetchList(outletId?: string): Observable<ProductItem[]> {
    return this.fetchProducts(outletId);
  }
}
