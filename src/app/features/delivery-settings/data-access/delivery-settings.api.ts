import { Injectable, inject } from '@angular/core';
import { HttpClientAdapter } from '@nukkadnow/api-client';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface DeliverySettingsDto {
  isDeliveryEnabled: boolean;
  deliveryRadiusKm: number;
  minOrderAmount: number;
  baseDeliveryFee: number;
  freeDeliveryAbove: number;
  estDeliveryMinutes: number;
  pincodes: string[];
  riders: Array<{
    id: string;
    name: string;
    phone: string;
    vehicle: string;
    status: string;
    activeOrdersCount: number;
  }>;
  geo: {
    lat: number;
    lng: number;
    locality: string;
    city: string;
    pincode: string;
    keyAreas: string[];
  } | null;
}

@Injectable({ providedIn: 'root' })
export class DeliverySettingsApi {
  private http = inject(HttpClientAdapter);
  private readonly baseUrl = '/api/v1/merchant/delivery-settings';

  fetchSettings(): Observable<DeliverySettingsDto | null> {
    return this.http.get<DeliverySettingsDto>(this.baseUrl).pipe(
      catchError(() => of(null))
    );
  }

  saveSettings(payload: Partial<DeliverySettingsDto>): Observable<any> {
    return this.http.put<any>(this.baseUrl, payload).pipe(
      catchError(err => { throw err; })
    );
  }
}
