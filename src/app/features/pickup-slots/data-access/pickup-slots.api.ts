import { Injectable, inject } from '@angular/core';
import { HttpClientAdapter } from '@nukkadnow/api-client';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class PickupSlotsApi {
  private http = inject(HttpClientAdapter);
  private readonly baseUrl = '/api/v1/merchant/pickup-slots';

  fetchSlots(date?: string): Observable<any> {
    const params: Record<string, string> = date ? { date } : {};
    return this.http.get<any>(this.baseUrl, params).pipe(
      catchError(() => of([]))
    );
  }

  updateSlot(slotId: string, payload: Partial<{ isBlocked: boolean; maxCapacity: number }>): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${slotId}`, payload).pipe(
      catchError(() => of(null))
    );
  }

  fetchList(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl).pipe(
      catchError(() => of([]))
    );
  }
}
