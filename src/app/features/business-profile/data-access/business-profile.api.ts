import { Injectable, inject } from '@angular/core';
import { HttpClientAdapter } from '@nukkadnow/api-client';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BusinessProfileApi {
  private http = inject(HttpClientAdapter);
  private readonly baseUrl = '/api/v1/merchant';

  fetchProfile(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/profile`);
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/profile`, data);
  }

  updateOperatingHours(outletId: string, hoursData: { isShopLiveOpen?: boolean; weeklySchedule?: any[] }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/outlets/${outletId}/hours`, hoursData);
  }

  fetchList(): Observable<any> {
    return this.fetchProfile();
  }
}
