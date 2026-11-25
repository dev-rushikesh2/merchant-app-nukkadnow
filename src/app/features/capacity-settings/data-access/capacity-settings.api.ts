import { Injectable, inject } from '@angular/core';
import { HttpClientAdapter } from '@nukkadnow/api-client';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class CapacitySettingsApi {
  private http = inject(HttpClientAdapter);
  private readonly baseUrl = '/api/v1/merchant/capacity-settings';

  fetchSettings(): Observable<any> {
    return this.http.get<any>(this.baseUrl).pipe(
      catchError(() => of(null))
    );
  }

  saveSettings(payload: any): Observable<any> {
    return this.http.put<any>(this.baseUrl, payload);
  }

  fetchList(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl).pipe(
      catchError(() => of([]))
    );
  }
}
