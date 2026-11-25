import { Routes } from '@angular/router';

export const AUDIT_LOG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/audit-logs-list.page').then((m) => m.AuditLogsListPageComponent),
  },
];
