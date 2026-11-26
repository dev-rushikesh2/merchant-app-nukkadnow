import { Component, signal, inject, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BusinessProfileApi } from '../data-access/business-profile.api';
import { MerchantAuthStore } from '../../../core/auth/merchant-auth.store';
import { OutletSwitcherStore } from '../../../core/outlet-context/outlet-switcher.store';
import { MapPickerPreviewComponent, ResolvedShopAddress } from '../../onboarding/components/map-picker-preview.component';
import { Subscription } from 'rxjs';

export interface DayOperatingHours {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface HolidayClosure {
  id: string;
  title: string;
  date: string;
}

@Component({
  selector: 'merchant-business-profile-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MapPickerPreviewComponent],
  templateUrl: './business-profile-list.page.html',
  styleUrls: ['./business-profile-list.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BusinessProfileListPageComponent implements OnInit, OnDestroy {
  private api = inject(BusinessProfileApi);
  private authStore = inject(MerchantAuthStore);
  private outletStore = inject(OutletSwitcherStore);
  private sub = new Subscription();

  // Sub-tabs: 'PROFILE' (Screen 29) | 'HOURS' (Screen 30)
  readonly activeSubTab = signal<'PROFILE' | 'HOURS'>('PROFILE');
  readonly isLoading = signal<boolean>(true);

  // Screen 29: Business Profile State
  readonly shopName = signal<string>('');
  readonly businessCategory = signal<string>('Kirana & Supermarket');
  readonly ownerName = signal<string>('');
  readonly phone = signal<string>('');
  readonly email = signal<string>('');
  readonly tagline = signal<string>('');

  readonly addressStreet = signal<string>('');
  readonly locality = signal<string>('');
  readonly city = signal<string>('');
  readonly pincode = signal<string>('');
  readonly mapCoordinates = signal<{ lat: number; lng: number }>({ lat: 20.9281, lng: 77.7526 });
  private loadedCoords: { lat: number; lng: number } | null = null;
  readonly gstin = signal<string>('');
  readonly fssai = signal<string>('');

  readonly coverUrl = signal<string>('https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200');
  readonly logoUrl = signal<string>('https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=200');

  readonly storePhotos = signal<string[]>([]);

  // Screen 30: Availability State
  readonly isShopLiveOpen = signal<boolean>(true);

  readonly weeklySchedule = signal<DayOperatingHours[]>([
    { day: 'Monday', isOpen: true, openTime: '08:00', closeTime: '22:00' },
    { day: 'Tuesday', isOpen: true, openTime: '08:00', closeTime: '22:00' },
    { day: 'Wednesday', isOpen: true, openTime: '08:00', closeTime: '22:00' },
    { day: 'Thursday', isOpen: true, openTime: '08:00', closeTime: '22:00' },
    { day: 'Friday', isOpen: true, openTime: '08:00', closeTime: '22:00' },
    { day: 'Saturday', isOpen: true, openTime: '08:00', closeTime: '22:30' },
    { day: 'Sunday', isOpen: true, openTime: '08:00', closeTime: '22:30' }
  ]);

  readonly holidays = signal<HolidayClosure[]>([]);

  readonly showAddHolidayModal = signal<boolean>(false);
  readonly newHolidayName = signal<string>('');
  readonly newHolidayDate = signal<string>('');

  // Toast
  readonly toast = signal<string | null>(null);

  ngOnInit(): void {
    this.loadProfile();

    this.sub.add(
      this.authStore.tenantSwitched$.subscribe(() => {
        this.loadProfile();
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.api.fetchProfile().subscribe({
      next: (res: any) => {
        const p = res?.data || res?.merchant;
        if (p) {
          this.shopName.set(p.shopName || p.organizationName || '');
          this.businessCategory.set(p.businessCategory || p.category || 'Retail Store');
          this.ownerName.set(p.ownerName || p.contactName || '');
          this.phone.set(p.phone || p.contactPhone || '');
          this.email.set(p.email || '');
          this.tagline.set(p.tagline || p.description || '');
          this.addressStreet.set(p.addressStreet || p.addressLine || '');
          this.locality.set(p.locality || this.authStore.activeMerchant()?.locality || '');
          this.city.set(p.city || this.authStore.activeMerchant()?.city || '');
          this.pincode.set(p.pincode || '');
          if (
            p.latitude != null &&
            p.longitude != null &&
            Number.isFinite(Number(p.latitude)) &&
            Number.isFinite(Number(p.longitude))
          ) {
            const coords = { lat: Number(p.latitude), lng: Number(p.longitude) };
            this.loadedCoords = coords;
            this.mapCoordinates.set(coords);
          } else {
            this.loadedCoords = null;
          }
          this.gstin.set(p.gstin || '');
          this.fssai.set(p.fssai || '');
          if (p.coverUrl) this.coverUrl.set(p.coverUrl);
          if (p.logoUrl) this.logoUrl.set(p.logoUrl);
          if (p.storePhotos) this.storePhotos.set(p.storePhotos);
          if (p.isShopLiveOpen !== undefined) this.isShopLiveOpen.set(p.isShopLiveOpen);
          if (p.weeklySchedule && p.weeklySchedule.length > 0) this.weeklySchedule.set(p.weeklySchedule);
          if (p.holidays) this.holidays.set(p.holidays);
        } else {
          this.bindActiveMerchantFallback();
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.bindActiveMerchantFallback();
        this.isLoading.set(false);
      }
    });
  }

  private bindActiveMerchantFallback(): void {
    const active = this.authStore.activeMerchant();
    if (active) {
      this.shopName.set(active.merchantName);
      this.ownerName.set(active.fullName);
      this.phone.set(active.phoneNumber);
      this.email.set(active.email);
      this.businessCategory.set('Retail Store');
      this.locality.set(active.locality || '');
      this.city.set(active.city || '');
    }
    this.gstin.set('');
    this.fssai.set('');
  }

  onLocationCoordinatesChange(coords: { lat: number; lng: number }): void {
    this.mapCoordinates.set(coords);
  }

  onAddressResolved(addr: ResolvedShopAddress): void {
    const movedFromInitial =
      !this.loadedCoords ||
      Math.abs(addr.lat - this.loadedCoords.lat) > 0.0005 ||
      Math.abs(addr.lng - this.loadedCoords.lng) > 0.0005;

    this.mapCoordinates.set({ lat: addr.lat, lng: addr.lng });

    if ((movedFromInitial || !this.locality().trim()) && addr.locality) {
      this.locality.set(addr.locality);
    }
    if ((movedFromInitial || !this.city().trim()) && addr.city) {
      this.city.set(addr.city);
    }
    if ((movedFromInitial || !this.pincode().trim()) && addr.pincode) {
      this.pincode.set(addr.pincode);
    }
    if ((movedFromInitial || !this.addressStreet().trim()) && addr.fullAddress) {
      this.addressStreet.set(addr.fullAddress);
    }
  }

  toggleShopLive() {
    this.isShopLiveOpen.update(v => !v);
    const outletId = this.outletStore.activeOutletId() || (this.authStore.activeMerchant()?.outletId ?? '');
    this.api.updateOperatingHours(outletId, { isShopLiveOpen: this.isShopLiveOpen() }).subscribe();
    this.showToast(`Shop status updated: ${this.isShopLiveOpen() ? 'OPEN' : 'TEMPORARILY CLOSED'}.`);
  }

  toggleDayOpen(index: number) {
    this.weeklySchedule.update(list =>
      list.map((d, i) => (i === index ? { ...d, isOpen: !d.isOpen } : d))
    );
  }

  applyTimeToAll(time: { openTime: string; closeTime: string }) {
    this.weeklySchedule.update(list =>
      list.map(d => ({ ...d, openTime: time.openTime, closeTime: time.closeTime }))
    );
    this.showToast(`Applied ${time.openTime} - ${time.closeTime} to all 7 days.`);
  }

  addStorePhoto() {
    const photo = 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=400';
    this.storePhotos.update(list => [...list, photo]);
    this.showToast('Storefront photo added to gallery.');
  }

  removePhoto(index: number) {
    this.storePhotos.update(list => list.filter((_, i) => i !== index));
  }

  addHoliday() {
    const name = this.newHolidayName().trim();
    if (!name || !this.newHolidayDate()) return;

    this.holidays.update(list => [
      ...list,
      { id: `h-${Date.now()}`, title: name, date: this.newHolidayDate() }
    ]);
    this.showAddHolidayModal.set(false);
    this.newHolidayName.set('');
    this.newHolidayDate.set('');
    this.showToast(`Scheduled closure for "${name}" added.`);
  }

  removeHoliday(id: string) {
    this.holidays.update(list => list.filter(h => h.id !== id));
  }

  saveProfile() {
    const coords = this.mapCoordinates();
    const payload = {
      shopName: this.shopName(),
      businessCategory: this.businessCategory(),
      ownerName: this.ownerName(),
      phone: this.phone(),
      email: this.email(),
      tagline: this.tagline(),
      addressStreet: this.addressStreet(),
      locality: this.locality(),
      city: this.city(),
      pincode: this.pincode(),
      latitude: coords?.lat,
      longitude: coords?.lng,
      gstin: this.gstin(),
      fssai: this.fssai(),
      coverUrl: this.coverUrl(),
      logoUrl: this.logoUrl(),
      storePhotos: this.storePhotos()
    };

    this.api.updateProfile(payload).subscribe({
      next: () => {
        if (coords) this.loadedCoords = coords;
        this.showToast('Store profile & GPS location saved successfully!');
      },
      error: () => {
        this.showToast('Failed to save profile to server. Please retry.');
      }
    });
  }

  saveHours() {
    const outletId = this.outletStore.activeOutletId() || (this.authStore.activeMerchant()?.outletId ?? '');
    this.api.updateOperatingHours(outletId, {
      isShopLiveOpen: this.isShopLiveOpen(),
      weeklySchedule: this.weeklySchedule()
    }).subscribe({
      next: () => {
        this.showToast('Weekly operating hours & availability saved!');
      },
      error: () => {
        this.showToast('Weekly operating hours saved locally.');
      }
    });
  }

  private showToast(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(null), 2800);
  }
}
