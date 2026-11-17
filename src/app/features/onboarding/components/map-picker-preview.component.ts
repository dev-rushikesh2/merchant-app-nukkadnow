import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  effect,
  viewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
  inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'merchant-map-picker-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-wrapper" role="region" aria-label="Interactive Store Location Map">
      <!-- Leaflet Map Container -->
      <div #mapContainer class="leaflet-map-host"></div>

      <!-- Floating Controls Top-Right -->
      <div class="map-overlay-controls">
        <button
          type="button"
          class="map-control-btn gps-btn"
          (click)="triggerLocate()"
          [title]="'Detect GPS Location'"
          aria-label="Detect current GPS location">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0F172A"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
            [class.spin]="isLocating()">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="22" y1="12" x2="18" y2="12"></line>
            <line x1="6" y1="12" x2="2" y2="12"></line>
            <line x1="12" y1="6" x2="12" y2="2"></line>
            <line x1="12" y1="22" x2="12" y2="18"></line>
          </svg>
        </button>

        <div class="zoom-btn-group">
          <button type="button" class="map-control-btn" (click)="zoomIn()" title="Zoom In" aria-label="Zoom in">+</button>
          <button type="button" class="map-control-btn" (click)="zoomOut()" title="Zoom Out" aria-label="Zoom out">−</button>
        </div>
      </div>

      <!-- Bottom Coordinate / Mode Status Strip -->
      <div class="map-bottom-strip" [class.privacy-active]="homeBusinessPrivacy()">
        @if (homeBusinessPrivacy()) {
          <div class="strip-privacy-indicator">
            <span class="shield-icon">🛡️</span>
            <div class="strip-text">
              <span class="badge-title">Home Privacy Mode Active</span>
              <span class="badge-sub">Customers only see approximate ~500m zone. Exact address hidden.</span>
            </div>
          </div>
        } @else {
          <div class="strip-coords-indicator">
            <span class="pin-icon">📍</span>
            <div class="strip-text">
              <span class="badge-title">{{ shopName() }}</span>
              <span class="badge-sub">{{ currentLat().toFixed(4) }}° N, {{ currentLng().toFixed(4) }}° E (Drag pin to fine-tune)</span>
            </div>
          </div>
        }
      </div>

      <!-- Toast Feedback -->
      @if (locateToast()) {
        <div class="locate-toast" role="status">
          {{ locateToast() }}
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .map-wrapper {
      width: 100%;
      height: 260px;
      border-radius: 16px;
      overflow: hidden;
      position: relative;
      border: 1px solid #E2E8F0;
      background: #E2E8F0;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    }

    .leaflet-map-host {
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    /* Floating map controls */
    .map-overlay-controls {
      position: absolute;
      top: 12px;
      right: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 400;
    }

    .map-control-btn {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 18px;
      font-weight: 700;
      color: #1E293B;
      transition: all 0.15s ease;

      &:hover {
        background: #F8FAFC;
        transform: scale(1.05);
      }
      &:active {
        transform: scale(0.95);
      }
    }

    .zoom-btn-group {
      display: flex;
      flex-direction: column;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);

      .map-control-btn {
        border-radius: 0;
        box-shadow: none;

        &:first-child {
          border-bottom: 1px solid #E2E8F0;
        }
      }
    }

    .spin {
      animation: spinAnim 1s linear infinite;
    }

    @keyframes spinAnim {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Bottom strip */
    .map-bottom-strip {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(8px);
      padding: 8px 14px;
      border-top: 1px solid rgba(226, 232, 240, 0.9);
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 400;
      transition: background 0.2s ease;

      &.privacy-active {
        background: rgba(255, 247, 237, 0.96);
        border-top-color: #FDBA74;
      }
    }

    .strip-coords-indicator,
    .strip-privacy-indicator {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .pin-icon, .shield-icon {
      font-size: 18px;
      flex-shrink: 0;
    }

    .strip-text {
      display: flex;
      flex-direction: column;
    }

    .badge-title {
      font-size: 12px;
      font-weight: 700;
      color: #0F172A;
      line-height: 1.2;
    }

    .badge-sub {
      font-size: 11px;
      color: #64748B;
      font-weight: 500;
    }

    .strip-privacy-indicator {
      .badge-title {
        color: #C2410C;
      }
      .badge-sub {
        color: #EA580C;
      }
    }

    .locate-toast {
      position: absolute;
      top: 12px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.9);
      color: #FFFFFF;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 9999px;
      backdrop-filter: blur(6px);
      z-index: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      animation: fadeInToast 0.25s ease;
    }

    @keyframes fadeInToast {
      from { opacity: 0; transform: translate(-50%, -8px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }

    /* Custom Leaflet Marker Styling injected into DOM */
    ::ng-deep {
      .nn-leaflet-marker {
        background: transparent;
        border: none;
      }

      .nn-pin-bubble {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -100%);
      }

      .nn-pin-head {
        background: #EA580C;
        color: #FFFFFF;
        padding: 5px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 5px;
        white-space: nowrap;
        box-shadow: 0 3px 10px rgba(234, 88, 12, 0.4);
        border: 2px solid #FFFFFF;
        transition: transform 0.15s ease;

        &:hover {
          transform: scale(1.08);
        }
      }

      .nn-pin-point {
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 8px solid #EA580C;
        margin-top: -1px;
      }

      .nn-pin-pulse {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: rgba(234, 88, 12, 0.35);
        animation: pinRadar 1.8s infinite ease-out;
        margin-top: -6px;
      }

      .nn-privacy-center-tag {
        transform: translate(-50%, -50%);
        background: #C2410C;
        color: #FFFFFF;
        padding: 4px 10px;
        border-radius: 14px;
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
        border: 2px solid #FFFFFF;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      @keyframes pinRadar {
        0% { transform: scale(0.6); opacity: 0.9; }
        100% { transform: scale(2.6); opacity: 0; }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapPickerPreviewComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  readonly mapContainerRef = viewChild<ElementRef<HTMLDivElement>>('mapContainer');

  // Inputs
  shopName = input<string>('Sharma General Store');
  locality = input<string>('Civil Lines');
  city = input<string>('Akola');
  coordinates = input<{ lat: number; lng: number }>({ lat: 20.7002, lng: 77.0082 });
  homeBusinessPrivacy = input<boolean>(false);

  // Outputs
  locationChange = output<{ lat: number; lng: number }>();

  // Internal reactive state
  readonly currentLat = signal<number>(20.7002);
  readonly currentLng = signal<number>(77.0082);
  readonly isLocating = signal<boolean>(false);
  readonly locateToast = signal<string | null>(null);

  private map?: L.Map;
  private marker?: L.Marker;
  private privacyCircle?: L.Circle;

  constructor() {
    // Keep internal signals in sync when coordinates input changes
    effect(() => {
      const coords = this.coordinates();
      if (coords && (coords.lat !== this.currentLat() || coords.lng !== this.currentLng())) {
        this.currentLat.set(coords.lat);
        this.currentLng.set(coords.lng);
        this.updateMapPosition(coords.lat, coords.lng, false);
      }
    });

    // Update privacy circle when toggle state changes
    effect(() => {
      const isPrivacy = this.homeBusinessPrivacy();
      this.refreshPrivacyLayer(isPrivacy);
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const el = this.mapContainerRef()?.nativeElement;
    if (!el) return;

    const initialLat = this.coordinates()?.lat ?? 20.7002;
    const initialLng = this.coordinates()?.lng ?? 77.0082;
    this.currentLat.set(initialLat);
    this.currentLng.set(initialLng);

    // Initialize Leaflet Map
    this.map = L.map(el, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });

    // Add OpenStreetMap raster tile layer
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.map);

    // Minimal attribution control bottom-right
    L.control.attribution({ position: 'bottomright', prefix: 'OSM' }).addTo(this.map);

    // Create marker
    this.createOrUpdateMarker(initialLat, initialLng);

    // Map click moves the pin
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.onPinMoved(e.latlng.lat, e.latlng.lng);
    });

    // Invalidate size to ensure clean tile rendering inside Angular layout
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 250);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }

  zoomIn(): void {
    this.map?.zoomIn();
  }

  zoomOut(): void {
    this.map?.zoomOut();
  }

  triggerLocate(): void {
    if (!navigator.geolocation) {
      this.showToast('Geolocation is not supported by your browser');
      return;
    }

    this.isLocating.set(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        this.isLocating.set(false);
        this.onPinMoved(lat, lng);
        this.map?.flyTo([lat, lng], 16, { duration: 1.2 });
        this.showToast(`GPS Location set (±${Math.round(pos.coords.accuracy)}m)`);
      },
      (err) => {
        this.isLocating.set(false);
        this.showToast('Could not access GPS. Please pin manually on map.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  private onPinMoved(lat: number, lng: number): void {
    this.currentLat.set(lat);
    this.currentLng.set(lng);
    this.updateMapPosition(lat, lng, true);
    this.locationChange.emit({ lat, lng });
  }

  private updateMapPosition(lat: number, lng: number, pan: boolean): void {
    if (!this.map) return;

    if (pan) {
      this.map.panTo([lat, lng]);
    }

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.createOrUpdateMarker(lat, lng);
    }

    if (this.privacyCircle) {
      this.privacyCircle.setLatLng([lat, lng]);
    }
  }

  private createOrUpdateMarker(lat: number, lng: number): void {
    if (!this.map) return;

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
      return;
    }

    const isPrivacy = this.homeBusinessPrivacy();
    const customIcon = this.createMarkerIcon(isPrivacy);

    this.marker = L.marker([lat, lng], {
      icon: customIcon,
      draggable: true
    }).addTo(this.map);

    this.marker.on('dragend', () => {
      const pos = this.marker?.getLatLng();
      if (pos) {
        this.onPinMoved(pos.lat, pos.lng);
      }
    });

    this.refreshPrivacyLayer(isPrivacy);
  }

  private refreshPrivacyLayer(isPrivacy: boolean): void {
    if (!this.map) return;

    const lat = this.currentLat();
    const lng = this.currentLng();

    if (isPrivacy) {
      // Create 500m circle if not already present
      if (!this.privacyCircle) {
        this.privacyCircle = L.circle([lat, lng], {
          radius: 500,
          color: '#EA580C',
          weight: 2,
          dashArray: '6, 6',
          fillColor: '#FDBA74',
          fillOpacity: 0.28
        }).addTo(this.map);
      } else {
        this.privacyCircle.setLatLng([lat, lng]);
        this.privacyCircle.addTo(this.map);
      }
    } else {
      if (this.privacyCircle && this.map.hasLayer(this.privacyCircle)) {
        this.map.removeLayer(this.privacyCircle);
      }
    }

    // Update marker icon
    if (this.marker) {
      this.marker.setIcon(this.createMarkerIcon(isPrivacy));
    }
  }

  private createMarkerIcon(isPrivacy: boolean): L.DivIcon {
    const title = isPrivacy ? '🛡️ Approximate Zone' : `🏪 ${this.shopName()}`;
    const html = isPrivacy
      ? `<div class="nn-privacy-center-tag"><span>${title}</span></div>`
      : `<div class="nn-pin-bubble">
           <div class="nn-pin-head"><span>${title}</span></div>
           <div class="nn-pin-point"></div>
           <div class="nn-pin-pulse"></div>
         </div>`;

    return L.divIcon({
      className: 'nn-leaflet-marker',
      html,
      iconSize: [0, 0],
      iconAnchor: [0, isPrivacy ? 0 : 20]
    });
  }

  private showToast(msg: string): void {
    this.locateToast.set(msg);
    setTimeout(() => {
      if (this.locateToast() === msg) {
        this.locateToast.set(null);
      }
    }, 3200);
  }
}
