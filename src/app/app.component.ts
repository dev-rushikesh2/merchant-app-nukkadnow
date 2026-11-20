import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MerchantShellComponent } from './layout/merchant-shell/merchant-shell.component';
import { ToastService } from './core/feedback/toast.service';

@Component({
  selector: 'merchant-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MerchantShellComponent],
  template: `
    <merchant-shell>
      <router-outlet></router-outlet>
    </merchant-shell>

    <!-- Global Toast Notifications Stack -->
    @if (toastService.toasts().length > 0) {
      <div class="toast-container" role="region" aria-live="polite">
        @for (toast of toastService.toasts(); track toast.id) {
          <div class="toast-item" [class]="toast.type" (click)="toastService.dismiss(toast.id)">
            <span class="toast-icon">
              @if (toast.type === 'error') { ⚠️ }
              @else if (toast.type === 'success') { ✓ }
              @else if (toast.type === 'warning') { ⚡ }
              @else { ℹ️ }
            </span>
            <span class="toast-text">{{ toast.message }}</span>
            <button type="button" class="toast-close" (click)="toastService.dismiss(toast.id); $event.stopPropagation()">×</button>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 420px;
      width: calc(100vw - 32px);
      pointer-events: none;
    }

    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      transition: transform 0.15s ease;

      &:hover {
        transform: translateY(-2px);
      }

      &.error {
        background: #FEF2F2;
        color: #991B1B;
        border: 1.5px solid #F87171;
      }

      &.warning {
        background: #FFFBEB;
        color: #92400E;
        border: 1.5px solid #FBBF24;
      }

      &.success {
        background: #ECFDF5;
        color: #065F46;
        border: 1.5px solid #34D399;
      }

      &.info {
        background: #EFF6FF;
        color: #1E40AF;
        border: 1.5px solid #60A5FA;
      }
    }

    .toast-icon {
      font-size: 16px;
      flex-shrink: 0;
    }

    .toast-text {
      flex: 1;
      line-height: 1.4;
    }

    .toast-close {
      background: none;
      border: none;
      font-size: 18px;
      line-height: 1;
      color: inherit;
      opacity: 0.6;
      cursor: pointer;
      padding: 0 4px;

      &:hover {
        opacity: 1;
      }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  readonly toastService = inject(ToastService);
}
