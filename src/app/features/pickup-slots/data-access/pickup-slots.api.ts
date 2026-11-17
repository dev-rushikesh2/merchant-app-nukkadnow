import { Injectable, inject } from '@angular/core';
import { HttpClientAdapter } from '@nukkadnow/api-client';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class PickupSlotsApi {
  private http = inject(HttpClientAdapter);
  private readonly baseUrl = '/api/v1/merchant/pickup-slots';

  fetchList(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl).pipe(
      catchError(() => of([]))
    );
  }
}
