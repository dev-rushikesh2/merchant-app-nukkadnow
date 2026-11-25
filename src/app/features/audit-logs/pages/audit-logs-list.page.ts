import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { MerchantAuthStore } from '../../../core/auth/merchant-auth.store';
import { StaffAccessApi } from '../../staff-access/data-access/staff-access.api';

export interface ShopAuditLogRow {
  id: string;
  tenantId: string;
  outletId?: string | null;
  actorStaffId: string;
  actorName: string;
  actorRole: string;
  authMode: string;
  module: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  targetLabel?: string | null;
  beforeState?: Record<string, any> | null;
  afterState?: Record<string, any> | null;
  notes?: string | null;
  createdAt: string;
}

@Component({
  selector: 'merchant-audit-logs-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './audit-logs-list.page.html',
  styleUrls: ['./audit-logs-list.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogsListPageComponent implements OnInit, OnDestroy {
  private readonly staffApi = inject(StaffAccessApi);
  private readonly authStore = inject(MerchantAuthStore);
  private readonly sub = new Subscription();

  readonly logs = signal<ShopAuditLogRow[]>([]);
  readonly staffMembers = signal<{ id: string; name: string; role: string }[]>([]);
  readonly loading = signal<boolean>(false);

  // Filters
  readonly selectedModule = signal<string>('ALL');
  readonly selectedStaffId = signal<string>('ALL');
  readonly fromDate = signal<string>('');
  readonly toDate = signal<string>('');
  readonly searchQuery = signal<string>('');

  readonly modules = ['ALL', 'ORDERS', 'CATALOG', 'INVENTORY', 'STAFF', 'DELIVERY', 'CAPACITY', 'PROFILE'];

  readonly filteredLogs = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const list = this.logs();
    if (!q) return list;
    return list.filter((row) => {
      return (
        String(row.actorName || '').toLowerCase().includes(q) ||
        String(row.actorRole || '').toLowerCase().includes(q) ||
        String(row.action || '').toLowerCase().includes(q) ||
        String(row.targetLabel || '').toLowerCase().includes(q) ||
        String(row.module || '').toLowerCase().includes(q)
      );
    });
  });

  ngOnInit(): void {
    this.loadStaffRoster();
    this.loadLogs();
    this.sub.add(
      this.authStore.tenantSwitched$.subscribe(() => {
        this.loadStaffRoster();
        this.loadLogs();
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadStaffRoster(): void {
    this.staffApi.fetchList().subscribe((rows) => {
      if (Array.isArray(rows)) {
        this.staffMembers.set(
          rows.map((r) => ({
            id: String(r.id),
            name: String(r.name || 'Staff'),
            role: String(r.role || 'Staff'),
          }))
        );
      }
    });
  }

  loadLogs(): void {
    this.loading.set(true);
    this.staffApi
      .fetchAuditLogs({
        module: this.selectedModule(),
        staffId: this.selectedStaffId(),
        from: this.fromDate() || undefined,
        to: this.toDate() || undefined,
        limit: 200,
      })
      .subscribe((rows) => {
        this.logs.set(Array.isArray(rows) ? rows : []);
        this.loading.set(false);
      });
  }

  resetFilters(): void {
    this.selectedModule.set('ALL');
    this.selectedStaffId.set('ALL');
    this.fromDate.set('');
    this.toDate.set('');
    this.searchQuery.set('');
    this.loadLogs();
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatTime(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  formatAction(action: string): string {
    return String(action || 'UPDATED')
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  formatStateEntries(state: Record<string, any> | null | undefined): { key: string; value: string }[] {
    if (!state || typeof state !== 'object') return [];
    return Object.entries(state)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => ({
        key: k,
        value: Array.isArray(v)
          ? v.join(', ')
          : typeof v === 'object'
            ? JSON.stringify(v)
            : String(v),
      }));
  }
}
