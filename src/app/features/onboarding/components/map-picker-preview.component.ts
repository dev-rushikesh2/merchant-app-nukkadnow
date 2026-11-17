import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'merchant-map-picker-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-container" role="region" aria-label="Store Location Map">
      <!-- Stylized Vector Map Graphics -->
      <svg class="map-svg-canvas" viewBox="0 0 600 320" preserveAspectRatio="none">
        <defs>
          <linearGradient id="mapBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#EBF4F6" />
            <stop offset="100%" stop-color="#E2EEF0" />
          </linearGradient>
          <linearGradient id="roadYellow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#FDE68A" />
            <stop offset="100%" stop-color="#FCD34D" />
          </linearGradient>
          <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.12" />
          </filter>
        </defs>

        <!-- Base Land -->
        <rect width="600" height="320" fill="url(#mapBg)" />

        <!-- Green Park Polygons -->
        <path d="M 40 20 L 140 30 L 160 110 L 60 120 Z" fill="#DCFCE7" opacity="0.8" />
        <path d="M 420 180 L 560 190 L 580 290 L 440 280 Z" fill="#DCFCE7" opacity="0.8" />
        <path d="M 380 40 L 490 20 L 520 90 L 400 100 Z" fill="#E2E8F0" opacity="0.6" />

        <!-- Minor Street Grid -->
        <path d="M 0 80 Q 200 90 600 70" stroke="#FFFFFF" stroke-width="6" fill="none" />
        <path d="M 0 160 Q 300 170 600 140" stroke="#FFFFFF" stroke-width="7" fill="none" />
        <path d="M 0 240 Q 250 230 600 250" stroke="#FFFFFF" stroke-width="6" fill="none" />

        <path d="M 120 0 L 140 320" stroke="#FFFFFF" stroke-width="6" fill="none" />
        <path d="M 460 0 L 440 320" stroke="#FFFFFF" stroke-width="6" fill="none" />
        <path d="M 230 0 L 250 320" stroke="#FFFFFF" stroke-width="5" fill="none" />

        <!-- Main Arterial Diagonal Road (Yellow) -->
        <path d="M 0 280 Q 200 200 400 100 T 600 20" stroke="url(#roadYellow)" stroke-width="14" fill="none" stroke-linecap="round" />
        <path d="M 0 280 Q 200 200 400 100 T 600 20" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="6,6" fill="none" />

        <!-- Secondary White Avenue Crossing through shop -->
        <path d="M 100 320 L 300 0" stroke="#FFFFFF" stroke-width="12" fill="none" />

        <!-- Building blocks -->
        <rect x="230" y="80" width="35" height="45" rx="3" fill="#CBD5E1" opacity="0.7" />
        <rect x="280" y="70" width="40" height="35" rx="3" fill="#CBD5E1" opacity="0.7" />
        <rect x="330" y="190" width="50" height="40" rx="3" fill="#CBD5E1" opacity="0.7" />
        <rect x="230" y="210" width="45" height="45" rx="3" fill="#CBD5E1" opacity="0.7" />
      </svg>

      <!-- Center Pin Target with Animated Beacon -->
      <div class="pin-anchor">
        <div class="beacon-pulse" [class.locating]="isLocating()"></div>
        <div class="pin-marker">
          <!-- 3D Red Map Pin SVG -->
          <svg width="34" height="42" viewBox="0 0 34 42" fill="none">
            <path d="M17 0C7.61 0 0 7.61 0 17C0 27.25 14.54 40.71 16.32 41.67C16.74 41.89 17.26 41.89 17.68 41.67C19.46 40.71 34 27.25 34 17C34 7.61 26.39 0 17 0Z" fill="#EF4444" />
            <circle cx="17" cy="15" r="7" fill="#B91C1C" />
            <circle cx="17" cy="15" r="5" fill="#FFFFFF" />
          </svg>
        </div>

        <!-- Floating Store Location Tooltip Card -->
        <div class="store-location-card">
          <div class="card-awning-icon">
            <svg width="24" height="20" viewBox="0 0 40 32" fill="none">
              <path d="M4 14L8 4H32L36 14H4Z" fill="#FF5A1F" />
              <path d="M4 14C4 16.2 5.8 18 8 18C10.2 18 12 16.2 12 14C12 16.2 13.8 18 16 18C18.2 18 20 16.2 20 14C20 16.2 21.8 18 24 18C26.2 18 28 16.2 28 14C28 16.2 29.8 18 32 18C34.2 18 36 16.2 36 14H4Z" fill="#EA580C" />
              <rect x="7" y="18" width="26" height="12" rx="2" fill="#0284C7" />
            </svg>
          </div>
          <div class="card-text-col">
            <span class="card-shop-name">{{ shopName() }}</span>
            <span class="card-shop-sub">{{ locality() }}, {{ city() }}</span>
          </div>
        </div>
      </div>

      <!-- Recenter / GPS Button -->
      <button
        type="button"
        class="recenter-btn"
        (click)="triggerLocate()"
        [title]="'Recenter location'"
        aria-label="Detect current location">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F172A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" [class.spin]="isLocating()">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="22" y1="12" x2="18" y2="12"></line>
          <line x1="6" y1="12" x2="2" y2="12"></line>
          <line x1="12" y1="6" x2="12" y2="2"></line>
          <line x1="12" y1="22" x2="12" y2="18"></line>
        </svg>
      </button>

      @if (locateToast()) {
        <div class="locate-toast">📍 GPS location updated</div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .map-container {
      width: 100%;
      height: 200px;
      border-radius: 16px;
      overflow: hidden;
      position: relative;
      border: 1px solid #E2E8F0;
      background: #EBF4F6;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    .map-svg-canvas {
      width: 100%;
      height: 100%;
      display: block;
    }

    .pin-anchor {
      position: absolute;
      left: 50%;
      top: 36%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      pointer-events: none;
    }

    .beacon-pulse {
      position: absolute;
      top: 30px;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: rgba(34, 197, 94, 0.35);
      animation: pulseRings 2s infinite ease-out;

      &.locating {
        animation-duration: 0.8s;
        background: rgba(59, 130, 246, 0.4);
      }
    }

    @keyframes pulseRings {
      0% {
        transform: scale(0.4);
        opacity: 0.9;
      }
      100% {
        transform: scale(2.4);
        opacity: 0;
      }
    }

    .pin-marker {
      position: relative;
      z-index: 2;
      filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2));
      animation: pinBounce 0.4s ease-out;
    }

    @keyframes pinBounce {
      0% { transform: translateY(-16px); }
      100% { transform: translateY(0); }
    }

    .store-location-card {
      margin-top: 6px;
      background: #FFFFFF;
      padding: 6px 12px;
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
      border: 1px solid #E2E8F0;
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      z-index: 3;
    }

    .card-awning-icon {
      display: flex;
      align-items: center;
    }

    .card-text-col {
      display: flex;
      flex-direction: column;
      text-align: left;
    }

    .card-shop-name {
      font-size: 13px;
      font-weight: 700;
      color: #0F172A;
      line-height: 1.2;
    }

    .card-shop-sub {
      font-size: 10.5px;
      color: #64748B;
      font-weight: 500;
    }

    .recenter-btn {
      position: absolute;
      right: 12px;
      bottom: 12px;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
      z-index: 5;

      &:hover {
        background: #F8FAFC;
        transform: scale(1.05);
      }
      &:active {
        transform: scale(0.95);
      }
    }

    .spin {
      animation: spinAnim 1s linear infinite;
    }

    @keyframes spinAnim {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .locate-toast {
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.88);
      color: #FFFFFF;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 9999px;
      backdrop-filter: blur(4px);
      z-index: 10;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translate(-50%, -6px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapPickerPreviewComponent {
  shopName = input<string>('Sharma General Store');
  locality = input<string>('Civil Lines');
  city = input<string>('Akola');

  readonly isLocating = signal<boolean>(false);
  readonly locateToast = signal<boolean>(false);

  triggerLocate(): void {
    this.isLocating.set(true);
    setTimeout(() => {
      this.isLocating.set(false);
      this.locateToast.set(true);
      setTimeout(() => this.locateToast.set(false), 2400);
    }, 600);
  }
}
