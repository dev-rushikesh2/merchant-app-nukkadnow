import { Injectable, inject } from '@angular/core';
import { HttpClientAdapter } from '@nukkadnow/api-client';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ProductItem, INITIAL_PRODUCTS } from '../models/catalogue-view.model';

@Injectable({ providedIn: 'root' })
export class CatalogueApi {
  private http = inject(HttpClientAdapter);
  private readonly baseUrl = '/api/v1/merchant/catalog/products';

  fetchProducts(outletId = 'outlet-main'): Observable<ProductItem[]> {
    return this.http.get<any[]>(this.baseUrl, { outletId }).pipe(
      map(items => {
        if (!items || items.length === 0) return INITIAL_PRODUCTS;
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
        console.warn('Catalog API offline or unreachable, falling back to local state:', err);
        return of(INITIAL_PRODUCTS);
      })
    );
  }

  createProduct(product: ProductItem): Observable<any> {
    const payload = {
      tenantId: 'tenant-default',
      outletId: product.outletId || 'outlet-main',
      name: product.title,
      description: product.description,
      category: product.category,
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

    return this.http.post<any>(this.baseUrl, payload).pipe(
      catchError(err => {
        console.warn('createProduct remote failed, maintaining local:', err);
        return of({ id: product.id, ...payload });
      })
    );
  }

  updatePricing(productId: string, variantId: string, pricePaise: number, compareAtPricePaise?: number): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${productId}/pricing`, {
      variantId,
      pricePaise,
      compareAtPricePaise,
    }).pipe(
      catchError(err => {
        console.warn('updatePricing remote failed, maintaining local:', err);
        return of({ success: true });
      })
    );
  }

  fetchList(): Observable<ProductItem[]> {
    return this.fetchProducts();
  }
}
