import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface SaveDraftPayload {
  applicationId?: string;
  currentStep?: number;
  data?: any;
  businessType?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class RegistrationApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiGatewayUrl}/merchant/onboarding`;

  saveDraft(payload: SaveDraftPayload): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/draft`, payload);
  }

  submit(applicationId: string, termsAgreed: boolean = true): Observable<any> {
    const payload = { applicationId, termsAgreed };
    return this.http.post<any>(`${this.baseUrl}/submit`, payload);
  }

  getStatus(identifier: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/status/${encodeURIComponent(identifier)}`);
  }

  uploadDocument(applicationId: string, doc: { documentType: string; fileName: string; fileUrl: string; fileSize?: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${applicationId}/documents`, doc);
  }

  updateStatus(applicationId: string, status: string, notes?: string): Observable<any> {
    const payload = { status, notes };
    return this.http.patch<any>(`${this.baseUrl}/${applicationId}/status`, payload);
  }
}
