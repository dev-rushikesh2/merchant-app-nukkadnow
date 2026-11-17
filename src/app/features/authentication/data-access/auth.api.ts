import { Injectable, inject } from '@angular/core';
import { HttpClientAdapter } from '@nukkadnow/api-client';
import { Observable } from 'rxjs';

export interface OtpRequestResponse {
  success: boolean;
  challengeId?: string;
  cooldownSeconds?: number;
  devOtp?: string;
  expiresInSeconds?: number;
}

export interface OtpVerifyResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    phoneNumber: string;
    roles: string[];
    tenantId: string;
    outletId: string;
    merchantName?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private http = inject(HttpClientAdapter);
  private readonly baseUrl = '/api/v1/merchant/auth';

  requestOtp(phoneNumber: string): Observable<OtpRequestResponse> {
    return this.http.post<OtpRequestResponse>(`${this.baseUrl}/otp/request`, { phoneNumber });
  }

  verifyOtp(challengeId: string, phoneNumber: string, otp: string): Observable<OtpVerifyResponse> {
    return this.http.post<OtpVerifyResponse>(`${this.baseUrl}/otp/verify`, { challengeId, phoneNumber, otp });
  }

  login(phoneNumber: string): Observable<OtpVerifyResponse> {
    return this.http.post<OtpVerifyResponse>(`${this.baseUrl}/login`, { phoneNumber });
  }
}
