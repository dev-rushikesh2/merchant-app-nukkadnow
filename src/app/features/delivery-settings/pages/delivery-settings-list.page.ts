import { 
  Component, 
  inject, 
  signal, 
  computed, 
  ChangeDetectionStrategy, 
  OnInit, 
  AfterViewInit, 
  OnDestroy,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import { MerchantAuthStore } from '../../../core/auth/merchant-auth.store';
import { DeliverySettingsApi } from '../data-access/delivery-settings.api';

export interface StoreRider {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  status: 'Available' | 'On Delivery' | 'Off Shift';
  activeOrdersCount: number;
}

export interface MerchantGeoLocation {
  lat: number;
  lng: number;
  locality: string;
  city: string;
  pincode: string;
  keyAreas: string[];
}

const DEFAULT_GEO: MerchantGeoLocation = {
  lat: 20.7002,
  lng: 77.0082,
  locality: '',
  city: '',
  pincode: '',
  keyAreas: []
};

@Component({
  selector: 'merchant-delivery-settings-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './delivery-settings-list.page.html',
  styleUrls: ['./delivery-settings-list.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeliverySettingsListPageComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly authStore = inject(MerchantAuthStore);
  private platformId = inject(PLATFORM_ID);
  private sub = new Subscription();

  private readonly deliveryApi = inject(DeliverySettingsApi);

  // Service toggle
  readonly isDeliveryEnabled = signal<boolean>(true);

  // Delivery configuration signals
  readonly deliveryRadiusKm = signal<number>(6.0);
  readonly minOrderAmount = signal<number>(149);
  readonly baseDeliveryFee = signal<number>(25);
  readonly freeDeliveryAbove = signal<number>(499);
  readonly estDeliveryMinutes = signal<number>(30);

  // Fullscreen map mode
  readonly isMapFullscreen = signal<boolean>(false);

  // Supported Pincodes -- loaded from API; empty until populated.
  readonly pincodes = signal<string[]>([]);
  readonly newPincode = signal<string>('');

  // Store Riders Roster
  readonly riders = signal<StoreRider[]>([]);
  readonly showAddRider = signal<boolean>(false);
  readonly newRiderName = signal<string>('');
  readonly newRiderPhone = signal<string>('');
  readonly newRiderVehicle = signal<string>('');

  // Toast
  readonly toast = signal<string | null>(null);

  // Active Merchant Geo Location -- loaded from backend delivery settings.
  readonly activeGeo = signal<MerchantGeoLocation>(DEFAULT_GEO);

  // Calculated Coverage Area in sq km (Ï€ * rÂ²)
  readonly coverageAreaSqKm = computed<number>(() => {
    const r = this.deliveryRadiusKm();
    return Math.round(Math.PI * r * r);
  });

  // Leaflet Map state
  private map: L.Map | null = null;
  private storeMarker: L.Marker | null = null;
  private radiusCircle: L.Circle | null = null;

  ngOnInit(): void {
    this.loadDeliverySettings();

    this.sub.add(
      this.authStore.tenantSwitched$.subscribe(() => {
        this.loadDeliverySettings();
        this.updateMapPositionAndRadius();
      })
    );
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Delay initialization slightly to ensure container DOM layout is stable
      setTimeout(() => {
        this.initLeafletMap();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  /**
   * Initializes the interactive Leaflet map with OpenStreetMap tiles and merchant coordinates
   */
  private initLeafletMap(): void {
    const container = document.getElementById('merchant-delivery-map');
    if (!container || this.map) return;

    const geo = this.activeGeo();
    const merchant = this.authStore.activeMerchant();

    // Create map centered on active store
    this.map = L.map(container, {
      center: [geo.lat, geo.lng],
      zoom: 13,
      zoomControl: true,
      attributionControl: false
    });

    // Add crisp OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: 'Â© OpenStreetMap'
    }).addTo(this.map);

    // Custom animated Store Pin
    const storePinIcon = L.divIcon({
      className: 'store-custom-marker-wrapper',
      html: `
        <div class="store-pin-beacon">
          <div class="beacon-pulse"></div>
          <div class="beacon-core">
            <span class="beacon-emoji">&#x1F3EA;</span>
          </div>
          <div class="beacon-arrow"></div>
        </div>
      `,
      iconSize: [44, 52],
      iconAnchor: [22, 50],
      popupAnchor: [0, -48]
    });

    this.storeMarker = L.marker([geo.lat, geo.lng], { icon: storePinIcon }).addTo(this.map);

    this.storeMarker.bindPopup(`
      <div class="store-map-popup">
        <strong class="popup-title">${merchant?.merchantName ?? 'Your Store'}</strong>
        <p class="popup-address">ðŸ“ ${geo.locality}, ${geo.city}</p>
        <span class="popup-radius-tag">Delivery Geofence: ${this.deliveryRadiusKm()} km</span>
      </div>
    `);

    // Geofence Radius Circle
    const radiusMeters = this.deliveryRadiusKm() * 1000;
    this.radiusCircle = L.circle([geo.lat, geo.lng], {
      radius: radiusMeters,
      color: '#6D28D9',
      weight: 2.5,
      dashArray: '6, 8',
      fillColor: '#8B5CF6',
      fillOpacity: 0.16
    }).addTo(this.map);

    // Fit map bounds to encompass the geofence circle
    this.map.fitBounds(this.radiusCircle.getBounds(), {
      padding: [24, 24],
      maxZoom: 15
    });

    // Invalidate size to ensure complete rendering without grey tiles
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 250);
  }

  /**
   * Updates map position and geofence when tenant or radius changes
   */
  private updateMapPositionAndRadius(): void {
    if (!this.map) return;

    const geo = this.activeGeo();
    const merchant = this.authStore.activeMerchant();
    const radiusMeters = this.deliveryRadiusKm() * 1000;

    // Update marker
    if (this.storeMarker) {
      this.storeMarker.setLatLng([geo.lat, geo.lng]);
      const newIcon = L.divIcon({
        className: 'store-custom-marker-wrapper',
        html: `
          <div class="store-pin-beacon">
            <div class="beacon-pulse"></div>
            <div class="beacon-core">
              <span class="beacon-emoji">&#x1F3EA;</span>
            </div>
            <div class="beacon-arrow"></div>
          </div>
        `,
        iconSize: [44, 52],
        iconAnchor: [22, 50],
        popupAnchor: [0, -48]
      });
      this.storeMarker.setIcon(newIcon);
      this.storeMarker.setPopupContent(`
        <div class="store-map-popup">
          <strong class="popup-title">${merchant?.merchantName ?? 'Your Store'}</strong>
          <p class="popup-address">ðŸ“ ${geo.locality}, ${geo.city}</p>
          <span class="popup-radius-tag">Delivery Geofence: ${this.deliveryRadiusKm()} km</span>
        </div>
      `);
    }

    // Update geofence circle
    if (this.radiusCircle) {
      this.radiusCircle.setLatLng([geo.lat, geo.lng]);
      this.radiusCircle.setRadius(radiusMeters);
      this.map.fitBounds(this.radiusCircle.getBounds(), {
        padding: [24, 24],
        maxZoom: 15
      });
    } else {
      this.map.setView([geo.lat, geo.lng], 13);
    }

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 150);
  }

  /**
   * Called when radius slider moves or preset is tapped
   */
  onRadiusChange(km: number): void {
    const cleanKm = Math.min(15, Math.max(1, Math.round(km * 2) / 2));
    this.deliveryRadiusKm.set(cleanKm);

    if (this.radiusCircle && this.map) {
      const radiusMeters = cleanKm * 1000;
      this.radiusCircle.setRadius(radiusMeters);
      this.map.fitBounds(this.radiusCircle.getBounds(), {
        padding: [24, 24],
        maxZoom: 15
      });

      if (this.storeMarker) {
        const geo = this.activeGeo();
        const merchant = this.authStore.activeMerchant();
        this.storeMarker.setPopupContent(`
          <div class="store-map-popup">
            <strong class="popup-title">${merchant?.merchantName ?? 'Your Store'}</strong>
            <p class="popup-address">ðŸ“ ${geo.locality}, ${geo.city}</p>
            <span class="popup-radius-tag">Delivery Geofence: ${cleanKm} km</span>
          </div>
        `);
      }
    }
  }

  /**
   * Toggles fullscreen map mode
   */
  toggleFullscreenMap(): void {
    const nextState = !this.isMapFullscreen();
    this.isMapFullscreen.set(nextState);

    // Give DOM time to reflow map container before recalculating Leaflet dimensions
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
        if (this.radiusCircle) {
          this.map.fitBounds(this.radiusCircle.getBounds(), {
            padding: [40, 40],
            maxZoom: 15
          });
        }
      }
    }, 200);
  }

  /**
   * Re-centers the map view onto the merchant's store location
   */
  recenterMap(): void {
    if (!this.map) return;
    const geo = this.activeGeo();
    if (this.radiusCircle) {
      this.map.fitBounds(this.radiusCircle.getBounds(), {
        padding: [28, 28],
        maxZoom: 15
      });
    } else {
      this.map.setView([geo.lat, geo.lng], 13);
    }
    this.storeMarker?.openPopup();
  }

  addRider(): void {
    const name = this.newRiderName().trim();
    const phone = this.newRiderPhone().trim();
    if (!name || phone.replace(/\D/g, '').length < 10) {
      this.showToast('Please enter rider full name and valid 10-digit mobile number.');
      return;
    }

    const rider: StoreRider = {
      id: `rider-${Date.now()}`,
      name,
      phone,
      vehicle: this.newRiderVehicle().trim() || 'Two-Wheeler Delivery',
      status: 'Available',
      activeOrdersCount: 0
    };

    this.riders.update(list => [...list, rider]);
    this.newRiderName.set('');
    this.newRiderPhone.set('');
    this.newRiderVehicle.set('');
    this.showAddRider.set(false);
    this.saveSettings(`Delivery partner "${name}" registered & saved!`);
  }

  toggleDelivery(): void {
    this.isDeliveryEnabled.update(v => !v);
    this.saveSettings(`Delivery service is now ${this.isDeliveryEnabled() ? 'ENABLED' : 'DISABLED'}.`);
  }

  addPincode(): void {
    const pin = this.newPincode().trim();
    if (!/^\d{6}$/.test(pin)) {
      this.showToast('Please enter a valid 6-digit pincode.');
      return;
    }
    if (this.pincodes().includes(pin)) {
      this.showToast(`Pincode ${pin} is already listed.`);
      return;
    }
    this.pincodes.update(list => [...list, pin]);
    this.newPincode.set('');
    this.saveSettings(`Pincode ${pin} added to delivery zone.`);
  }

  removePincode(pin: string): void {
    this.pincodes.update(list => list.filter(p => p !== pin));
    this.saveSettings(`Pincode ${pin} removed.`);
  }

  toggleRiderStatus(riderId: string): void {
    this.riders.update(list =>
      list.map(r => {
        if (r.id === riderId) {
          const nextStatus = r.status === 'Available' ? 'Off Shift' : 'Available';
          return { ...r, status: nextStatus };
        }
        return r;
      })
    );
    this.saveSettings('Rider availability status updated.');
  }

  saveSettings(customMessage?: string): void {
    const payload = {
      isDeliveryEnabled: this.isDeliveryEnabled(),
      deliveryRadiusKm: this.deliveryRadiusKm(),
      minOrderAmount: this.minOrderAmount(),
      baseDeliveryFee: this.baseDeliveryFee(),
      freeDeliveryAbove: this.freeDeliveryAbove(),
      estDeliveryMinutes: this.estDeliveryMinutes(),
      pincodes: this.pincodes(),
      riders: this.riders(),
    };
    this.deliveryApi.saveSettings(payload).subscribe({
      next: () => {
        this.showToast(customMessage || `Delivery geofence (${this.deliveryRadiusKm()} km) and pricing rules saved!`);
      },
      error: () => {
        this.showToast('Failed to save delivery settings. Please retry.');
      }
    });
  }

  /**
   * Loads delivery settings from the backend.
   * Populates all configuration signals from the API response.
   * On error, signals remain at their initial empty/zero values.
   */
  private loadDeliverySettings(): void {
    this.deliveryApi.fetchSettings().subscribe({
      next: (data) => {
        if (!data) return;

        this.isDeliveryEnabled.set(data.isDeliveryEnabled ?? true);
        this.deliveryRadiusKm.set(data.deliveryRadiusKm ?? 6.0);
        this.minOrderAmount.set(data.minOrderAmount ?? 0);
        this.baseDeliveryFee.set(data.baseDeliveryFee ?? 0);
        this.freeDeliveryAbove.set(data.freeDeliveryAbove ?? 0);
        this.estDeliveryMinutes.set(data.estDeliveryMinutes ?? 0);
        this.pincodes.set(data.pincodes ?? []);

        if (Array.isArray(data.riders)) {
          this.riders.set(data.riders.map(r => ({
            id: r.id,
            name: r.name,
            phone: r.phone,
            vehicle: r.vehicle,
            status: (r.status as StoreRider['status']) ?? 'Off Shift',
            activeOrdersCount: r.activeOrdersCount ?? 0
          })));
        }

        if (data.geo) {
          this.activeGeo.set({
            lat: data.geo.lat,
            lng: data.geo.lng,
            locality: data.geo.locality ?? '',
            city: data.geo.city ?? '',
            pincode: data.geo.pincode ?? '',
            keyAreas: data.geo.keyAreas ?? []
          });
          // Update map position if the map is already initialised
          this.updateMapPositionAndRadius();
        }
      },
      error: () => {
        // Settings unavailable -- signals stay at defaults; map shows DEFAULT_GEO
      }
    });
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(null), 2800);
  }
}

