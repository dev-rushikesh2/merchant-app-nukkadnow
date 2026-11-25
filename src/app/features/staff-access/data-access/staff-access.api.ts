import { Injectable, inject } from '@angular/core';
import { HttpClientAdapter } from '@nukkadnow/api-client';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface StaffMemberPayload {
  name: string;
  phone: string;
  role: string;
  pin?: string;
  permissions?: string[];
}

export interface StaffUpdatePayload {
  isActive?: boolean;
  role?: string;
  pin?: string;
  permissions?: string[];
}

@Injectable({ providedIn: 'root' })
export class StaffAccessApi {
  private http = inject(HttpClientAdapter);
  private readonly baseUrl = '/api/v1/merchant/staff-access';

  fetchList(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl).pipe(
      catchError(() => of([]))
    );
  }

  inviteStaff(payload: StaffMemberPayload): Observable<any> {
    return this.http.post<any>(this.baseUrl, payload);
  }

  updateStaff(staffId: string, payload: StaffUpdatePayload): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${encodeURIComponent(staffId)}`, payload);
  }

  removeStaff(staffId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${encodeURIComponent(staffId)}`);
  }

  verifyPin(pin: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/verify-pin`, { pin });
  }

  fetchAuditLogs(params?: { module?: string; staffId?: string; from?: string; to?: string; limit?: number }): Observable<any[]> {
    let query = '';
    if (params) {
      const parts: string[] = [];
      if (params.module) parts.push(`module=${encodeURIComponent(params.module)}`);
      if (params.staffId) parts.push(`staffId=${encodeURIComponent(params.staffId)}`);
      if (params.from) parts.push(`from=${encodeURIComponent(params.from)}`);
      if (params.to) parts.push(`to=${encodeURIComponent(params.to)}`);
      if (params.limit) parts.push(`limit=${params.limit}`);
      if (parts.length) query = '?' + parts.join('&');
    }
    return this.http.get<any[]>(`/api/v1/merchant/audit-logs${query}`).pipe(
      catchError(() => of([]))
    );
  }
}
