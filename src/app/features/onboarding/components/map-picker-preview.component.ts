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
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientAdapter } from '@nukkadnow/api-client';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as L from 'leaflet';

export interface ResolvedShopAddress {
  lat: number;
  lng: number;
  locality: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  fullAddress: string;
}

@Component({
  selector: 'merchant-map-picker-preview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="map-wrapper" role="region" aria-label="Interactive Store Location Map">
      <!-- Leaflet Map Container -->
      <div #mapContainer class="leaflet-map-host"></div>

      <!-- Floating Search Bar Overlay -->
      <div class="map-search-overlay">
        <div class="search-pill">
          <span class="search-lens">🔍</span>
          <input
            type="text"
            class="map-search-input"
            placeholder="Search shop street, colony, city or pincode..."
            [ngModel]="searchQuery()"
            (ngModelChange)="onSearchInput($event)" />
          @if (searchQuery()) {
            <button type="button" class="clear-btn" (click)="clearSearch()" aria-label="Clear search">✕</button>
          }
        </div>
        @if (searchResults().length > 0) {
          <div class="search-dropdown">
            @for (item of searchResults(); track item.id) {
              <button type="button" class="dropdown-row" (click)="selectSearchResult(item)">
                <span>📍</span>
                <div class="drop-text">
                  <strong>{{ item.name }}</strong>
                  <small>{{ item.distance }}</small>
                </div>
              </button>
            }
          </div>
        }
      </div>

      <!-- Floating Controls Top-Right -->
      <div class="map-overlay-controls">
        <button
          type="button"
          class="map-control-btn gps-pill-btn"
          (click)="triggerLocate()"
          [title]="'Detect Real Shop GPS Location'"
          aria-label="Detect current GPS location">
          <span>{{ isLocating() ? '⏳' : '🎯' }}</span>
          <span>{{ isLocating() ? 'Locating...' : 'Use Shop GPS' }}</span>
        </button>

        <div class="zoom-btn-group">
          <button type="button" class="map-control-btn" (click)="zoomIn()" title="Zoom In" aria-label="Zoom in">+</button>
          <button type="button" class="map-control-btn" (click)="zoomOut()" title="Zoom Out" aria-label="Zoom out">−</button>
        </div>
      </div>

      <!-- Bottom Coordinate / Resolved Address Strip -->
      <div class="map-bottom-strip" [class.privacy-active]="homeBusinessPrivacy()">
        @if (homeBusinessPrivacy()) {
          <div class="strip-privacy-indicator">
            <span class="shield-icon">🛡️</span>
            <div class="strip-text">
              <span class="badge-title">Home Privacy Mode Active ({{ resolvedSummary() }})</span>
              <span class="badge-sub">Customers only see approximate ~500m zone. Exact address hidden.</span>
            </div>
          </div>
        } @else {
          <div class="strip-coords-indicator">
            <span class="pin-icon">📍</span>
            <div class="strip-text">
              <span class="badge-title">{{ shopName() }} · {{ resolvedSummary() }}</span>
              <span class="badge-sub">{{ currentLat().toFixed(4) }}° N, {{ currentLng().toFixed(4) }}° E (Tap map or drag pin to set exact shop doorstep)</span>
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
      height: 310px;
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

    .map-search-overlay {
      position: absolute;
      top: 10px;
      left: 10px;
      right: 145px;
      z-index: 450;
    }

    .search-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      border-radius: 10px;
      padding: 4px 10px;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
    }

    .search-lens { font-size: 13px; }

    .map-search-input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 12.5px;
      color: #0F172A;
      background: transparent;
      padding: 4px 0;
      min-width: 0;
    }

    .clear-btn {
      border: none;
      background: #F1F5F9;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      font-size: 11px;
      cursor: pointer;
    }

    .search-dropdown {
      margin-top: 4px;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.14);
      max-height: 170px;
      overflow-y: auto;
    }

    .dropdown-row {
      width: 100%;
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px 10px;
      border: none;
      border-bottom: 1px solid #F1F5F9;
      background: #FFFFFF;
      text-align: left;
      cursor: pointer;

      &:hover { background: #FFF7ED; }
      &:last-child { border-bottom: none; }

      .drop-text {
        display: flex;
        flex-direction: column;
        strong { font-size: 12.5px; color: #0F172A; }
        small { font-size: 11px; color: #64748B; }
      }
    }

    .map-overlay-controls {
      position: absolute;
      top: 10px;
      right: 10px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
      z-index: 400;
    }

    .map-control-btn {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 16px;
      font-weight: 700;
      color: #1E293B;

      &:hover { background: #F8FAFC; }
    }

    .gps-pill-btn {
      width: auto;
      padding: 0 10px;
      gap: 5px;
      font-size: 11.5px;
      font-weight: 800;
      color: #EA580C;
      border-color: #FED7AA;
      background: #FFF7ED;
      &:hover { background: #FFEDD5; }
    }

    .zoom-btn-group {
      display: flex;
      flex-direction: column;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid #CBD5E1;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);

      .map-control-btn {
        border: none;
        border-radius: 0;
        box-shadow: none;
        &:first-child { border-bottom: 1px solid #E2E8F0; }
      }
    }

    .map-bottom-strip {
      position: absolute;
      bottom: 10px;
      left: 10px;
      right: 10px;
      z-index: 400;
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 8px 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .strip-privacy-indicator,
    .strip-coords-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .strip-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .badge-title {
      font-size: 12px;
      font-weight: 800;
      color: #0F172A;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .badge-sub {
      font-size: 10.5px;
      color: #64748B;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .locate-toast {
      position: absolute;
      top: 52px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 500;
      background: #0F172A;
      color: #FFFFFF;
      padding: 6px 12px;
      border-radius: 9999px;
      font-size: 11.5px;
      font-weight: 700;
      white-space: nowrap;
    }

    ::ng-deep {
      .nn-leaflet-marker { background: transparent; border: none; }
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
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
        box-shadow: 0 3px 10px rgba(234, 88, 12, 0.4);
        border: 2px solid #FFFFFF;
      }
      .nn-pin-point {
        width: 0; height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 8px solid #EA580C;
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
        border: 2px solid #FFFFFF;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapPickerPreviewComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClientAdapter);
  readonly mapContainerRef = viewChild<ElementRef<HTMLDivElement>>('mapContainer');

  shopName = input<string>('My Shop');
  locality = input<string>('');
  city = input<string>('');
  coordinates = input<{ lat: number; lng: number }>({ lat: 20.9281, lng: 77.7526 });
  homeBusinessPrivacy = input<boolean>(false);

  locationChange = output<{ lat: number; lng: number }>();
  addressResolved = output<ResolvedShopAddress>();

  readonly currentLat = signal<number>(20.9281);
  readonly currentLng = signal<number>(77.7526);
  readonly isLocating = signal<boolean>(false);
  readonly locateToast = signal<string | null>(null);
  readonly searchQuery = signal<string>('');
  readonly searchResults = signal<any[]>([]);
  readonly resolvedSummary = signal<string>('Pin shop location');

  private map?: L.Map;
  private marker?: L.Marker;
  private privacyCircle?: L.Circle;
  private searchDebounce: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const coords = this.coordinates();
      if (coords && (coords.lat !== this.currentLat() || coords.lng !== this.currentLng())) {
        queueMicrotask(() => {
          this.currentLat.set(coords.lat);
          this.currentLng.set(coords.lng);
          this.updateMapPosition(coords.lat, coords.lng, true);
        });
      }
    });

    effect(() => {
      const isPrivacy = this.homeBusinessPrivacy();
      queueMicrotask(() => this.refreshPrivacyLayer(isPrivacy));
    });

    effect(() => {
      const loc = this.locality();
      const ct = this.city();
      const combined = [loc, ct].filter(Boolean).join(', ');
      if (combined) {
        queueMicrotask(() => this.resolvedSummary.set(combined));
      }
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const el = this.mapContainerRef()?.nativeElement;
    if (!el) return;

    const initialLat = this.coordinates()?.lat ?? 20.9281;
    const initialLng = this.coordinates()?.lng ?? 77.7526;
    this.currentLat.set(initialLat);
    this.currentLng.set(initialLng);

    this.map = L.map(el, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.map);

    L.control.attribution({ position: 'bottomright', prefix: 'OSM' }).addTo(this.map);

    this.createOrUpdateMarker(initialLat, initialLng);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.onPinMoved(e.latlng.lat, e.latlng.lng, true);
    });

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 250);
  }

  ngOnDestroy(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }

  onSearchInput(val: string): void {
    this.searchQuery.set(val);
    if (!val.trim()) {
      this.searchResults.set([]);
      return;
    }
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.http
        .get<any>('/api/v1/merchant/locations/areas', {
          q: val.trim(),
          lat: String(this.currentLat()),
          lng: String(this.currentLng()),
        })
        .pipe(catchError(() => of(null)))
        .subscribe((res) => {
          const items = Array.isArray(res?.data) ? res.data : [];
          this.searchResults.set(items.slice(0, 5));
        });
    }, 280);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.searchResults.set([]);
  }

  selectSearchResult(item: any): void {
    this.clearSearch();
    const lat = Number(item.latitude);
    const lng = Number(item.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    this.onPinMoved(lat, lng, true);
    this.map?.flyTo([lat, lng], 16, { duration: 0.7 });
  }

  zoomIn(): void {
    this.map?.zoomIn();
  }

  zoomOut(): void {
    this.map?.zoomOut();
  }

  triggerLocate(): void {
    if (!navigator.geolocation) {
      this.showToast('Geolocation not supported in this browser.');
      return;
    }

    this.isLocating.set(true);
    const onSuccess = (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      this.isLocating.set(false);
      this.onPinMoved(lat, lng, true);
      this.map?.flyTo([lat, lng], 16, { duration: 0.8 });
      this.showToast(`Real shop GPS detected (±${Math.round(pos.coords.accuracy)}m)`);
    };

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          this.isLocating.set(false);
          this.showToast('GPS blocked — search your street above or click the map.');
          return;
        }
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          () => {
            this.isLocating.set(false);
            this.showToast('Could not detect GPS — search your street above or click the map.');
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 }
        );
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 30000 }
    );
  }

  private onPinMoved(lat: number, lng: number, shouldReverse: boolean): void {
    this.currentLat.set(lat);
    this.currentLng.set(lng);
    this.updateMapPosition(lat, lng, true);
    this.locationChange.emit({ lat, lng });

    if (shouldReverse) {
      this.resolvedSummary.set('Detecting street address...');
      this.http
        .get<any>('/api/v1/merchant/locations/reverse', {
          lat: String(lat),
          lng: String(lng),
        })
        .pipe(catchError(() => of(null)))
        .subscribe((res) => {
          const d = res?.data;
          if (!d) return;
          this.resolvedSummary.set(d.name || `${d.locality}, ${d.city}`);
          this.addressResolved.emit({
            lat,
            lng,
            locality: d.locality || '',
            city: d.city || '',
            district: d.district || d.city || '',
            state: d.state || 'Maharashtra',
            pincode: d.pincode || '',
            fullAddress: d.fullAddress || '',
          });
        });
    }
  }

  private updateMapPosition(lat: number, lng: number, pan: boolean): void {
    if (!this.map) return;
    if (pan) this.map.panTo([lat, lng]);
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.createOrUpdateMarker(lat, lng);
    }
    this.privacyCircle?.setLatLng([lat, lng]);
  }

  private createOrUpdateMarker(lat: number, lng: number): void {
    if (!this.map) return;
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
      return;
    }

    const isPrivacy = this.homeBusinessPrivacy();
    this.marker = L.marker([lat, lng], {
      icon: this.createMarkerIcon(isPrivacy),
      draggable: true,
    }).addTo(this.map);

    this.marker.on('dragend', () => {
      const pos = this.marker?.getLatLng();
      if (pos) {
        this.onPinMoved(pos.lat, pos.lng, true);
      }
    });

    this.refreshPrivacyLayer(isPrivacy);
  }

  private refreshPrivacyLayer(isPrivacy: boolean): void {
    if (!this.map) return;
    const lat = this.currentLat();
    const lng = this.currentLng();

    if (isPrivacy) {
      if (!this.privacyCircle) {
        this.privacyCircle = L.circle([lat, lng], {
          radius: 500,
          color: '#EA580C',
          weight: 2,
          dashArray: '6, 6',
          fillColor: '#FDBA74',
          fillOpacity: 0.28,
        }).addTo(this.map);
      } else {
        this.privacyCircle.setLatLng([lat, lng]);
        this.privacyCircle.addTo(this.map);
      }
    } else if (this.privacyCircle && this.map.hasLayer(this.privacyCircle)) {
      this.map.removeLayer(this.privacyCircle);
    }

    this.marker?.setIcon(this.createMarkerIcon(isPrivacy));
  }

  private createMarkerIcon(isPrivacy: boolean): L.DivIcon {
    const title = isPrivacy ? '🛡️ Approximate Zone' : `🏪 ${this.shopName()}`;
    const html = isPrivacy
      ? `<div class="nn-privacy-center-tag"><span>${title}</span></div>`
      : `<div class="nn-pin-bubble">
           <div class="nn-pin-head"><span>${title}</span></div>
           <div class="nn-pin-point"></div>
         </div>`;

    return L.divIcon({
      className: 'nn-leaflet-marker',
      html,
      iconSize: [0, 0],
      iconAnchor: [0, isPrivacy ? 0 : 20],
    });
  }

  private showToast(msg: string): void {
    this.locateToast.set(msg);
    setTimeout(() => {
      if (this.locateToast() === msg) {
        this.locateToast.set(null);
      }
    }, 3500);
  }
}
