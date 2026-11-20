import { Injectable, signal } from '@angular/core';

export interface ToastItem {
  id: string;
  message: string;
  type: 'error' | 'success' | 'warning' | 'info';
  durationMs: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  readonly toasts = signal<ToastItem[]>([]);

  show(message: string, type: 'error' | 'success' | 'warning' | 'info' = 'info', durationMs = 4000): void {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const toast: ToastItem = { id, message, type, durationMs };

    this.toasts.update(list => [...list, toast]);

    if (durationMs > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, durationMs);
    }
  }

  dismiss(id: string): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
