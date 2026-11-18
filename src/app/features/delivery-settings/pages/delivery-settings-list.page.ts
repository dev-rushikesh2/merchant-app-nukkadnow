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

const MERCHANT_GEO_DATA: Record<string, MerchantGeoLocation> = {
  'merchant-sabji-001': {
    lat: 21.1458,
    lng: 79.0882,
    locality: 'Sitabuldi Wholesale Mandi',
    city: 'Nagpur',
    pincode: '440012',
    keyAreas: ['Sitabuldi', 'Dhantoli', 'Dharampeth', 'Mahal', 'Ramdaspeth', 'Civil Lines', 'Sadar']
  },
  'merchant-kirana-002': {
    lat: 20.7002,
    lng: 77.0082,
    locality: 'Civil Lines Market',
    city: 'Akola',
    pincode: '444001',
    keyAreas: ['Civil Lines', 'Ramdaspeth', 'Toshniwal Layout', 'Jatharpeth', 'Gorakshan Road', 'Malkapur']
  },
  'merchant-garguti-003': {
    lat: 20.7035,
    lng: 77.0125,
    locality: 'Ramdaspeth Heights',
    city: 'Akola',
    pincode: '444005',
    keyAreas: ['Ramdaspeth', 'Tilak Road', 'Ratanlal Plot', 'Old City', 'Kaulkhed', 'Civil Lines']
  },
  'merchant-sweets-004': {
    lat: 21.1415,
    lng: 79.0655,
    locality: 'West High Court Road, Dharampeth',
    city: 'Nagpur',
    pincode: '440010',
    keyAreas: ['Dharampeth', 'Gokulpeth', 'Shivaji Nagar', 'Ram Nagar', 'Bajaj Nagar', 'Laxmi Nagar', 'Sitabuldi']
  }
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

  // Supported Pincodes
  readonly pincodes = signal<string[]>(['440010', '440012', '440015', '440022']);
  readonly newPincode = signal<string>('');

  // Store Riders Roster
  readonly riders = signal<StoreRider[]>([]);
  readonly showAddRider = signal<boolean>(false);
  readonly newRiderName = signal<string>('');
  readonly newRiderPhone = signal<string>('');
  readonly newRiderVehicle = signal<string>('');

  // Toast
  readonly toast = signal<string | null>(null);

  // Active Merchant Geo Location
  readonly activeGeo = computed<MerchantGeoLocation>(() => {
    const tenantId = this.authStore.activeMerchant().tenantId;
    return MERCHANT_GEO_DATA[tenantId] || MERCHANT_GEO_DATA['merchant-kirana-002'];
  });

  // Calculated Coverage Area in sq km (π * r²)
  readonly coverageAreaSqKm = computed<number>(() => {
    const r = this.deliveryRadiusKm();
    return Math.round(Math.PI * r * r);
  });

  // Leaflet Map state
  private map: L.Map | null = null;
  private storeMarker: L.Marker | null = null;
  private radiusCircle: L.Circle | null = null;

  ngOnInit(): void {
    // Sync default pincode from active merchant
    const geo = this.activeGeo();
    if (!this.pincodes().includes(geo.pincode)) {
      this.pincodes.update(list => [geo.pincode, ...list]);
    }

    this.sub.add(
      this.authStore.tenantSwitched$.subscribe(() => {
        const nextGeo = this.activeGeo();
        if (!this.pincodes().includes(nextGeo.pincode)) {
          this.pincodes.set([nextGeo.pincode, '440010', '440012', '440015']);
        }
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
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    // Custom animated Store Pin
    const storePinIcon = L.divIcon({
      className: 'store-custom-marker-wrapper',
      html: `
        <div class="store-pin-beacon">
          <div class="beacon-pulse"></div>
          <div class="beacon-core">
            <span class="beacon-emoji">${merchant.avatarIcon || '🏪'}</span>
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
        <strong class="popup-title">${merchant.merchantName}</strong>
        <p class="popup-address">📍 ${geo.locality}, ${geo.city}</p>
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
              <span class="beacon-emoji">${merchant.avatarIcon || '🏪'}</span>
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
          <strong class="popup-title">${merchant.merchantName}</strong>
          <p class="popup-address">📍 ${geo.locality}, ${geo.city}</p>
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
            <strong class="popup-title">${merchant.merchantName}</strong>
            <p class="popup-address">📍 ${geo.locality}, ${geo.city}</p>
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
    if (!name || !phone) return;

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
    this.showToast(`Delivery partner "${name}" registered successfully!`);
  }

  toggleDelivery(): void {
    this.isDeliveryEnabled.update(v => !v);
    this.showToast(`Delivery service is now ${this.isDeliveryEnabled() ? 'ENABLED' : 'DISABLED'}.`);
  }

  addPincode(): void {
    const pin = this.newPincode().trim();
    if (pin.length === 6 && !this.pincodes().includes(pin)) {
      this.pincodes.update(list => [...list, pin]);
      this.newPincode.set('');
      this.showToast(`Pincode ${pin} added to delivery zone.`);
    }
  }

  removePincode(pin: string): void {
    this.pincodes.update(list => list.filter(p => p !== pin));
    this.showToast(`Pincode ${pin} removed.`);
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
  }

  saveSettings(): void {
    this.showToast(`Delivery geofence (${this.deliveryRadiusKm()} km) and pricing rules saved!`);
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(null), 2800);
  }
}
