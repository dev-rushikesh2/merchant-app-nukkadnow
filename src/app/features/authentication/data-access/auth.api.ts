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
    phoneNumber?: string;
    email?: string;
    fullName?: string;
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

  requestOtp(identifier: string): Observable<OtpRequestResponse> {
    const isEmail = identifier.includes('@');
    const payload = isEmail ? { email: identifier.trim() } : { phoneNumber: identifier.trim() };
    return this.http.post<OtpRequestResponse>(`${this.baseUrl}/otp/request`, payload);
  }

  verifyOtp(challengeId: string | null, identifier: string, otp: string): Observable<OtpVerifyResponse> {
    const isEmail = identifier.includes('@');
    const payload: any = { otp: otp.trim() };
    if (challengeId) payload.challengeId = challengeId;
    if (isEmail) {
      payload.email = identifier.trim();
    } else {
      payload.phoneNumber = identifier.trim();
    }
    return this.http.post<OtpVerifyResponse>(`${this.baseUrl}/otp/verify`, payload);
  }

  login(identifier: string): Observable<OtpVerifyResponse> {
    const isEmail = identifier.includes('@');
    const payload = isEmail ? { email: identifier.trim() } : { phoneNumber: identifier.trim() };
    return this.http.post<OtpVerifyResponse>(`${this.baseUrl}/login`, payload);
  }
}
