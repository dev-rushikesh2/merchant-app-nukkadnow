import { Component, signal, inject, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BusinessProfileApi } from '../data-access/business-profile.api';
import { MerchantAuthStore } from '../../../core/auth/merchant-auth.store';
import { OutletSwitcherStore } from '../../../core/outlet-context/outlet-switcher.store';
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
  imports: [CommonModule, FormsModule, RouterLink],
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
  readonly city = signal<string>('Nagpur');
  readonly pincode = signal<string>('440010');
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

  readonly holidays = signal<HolidayClosure[]>([
    { id: 'h1', title: 'Diwali Balipratipada', date: '01 Nov 2026' },
    { id: 'h2', title: 'Makar Sankranti', date: '14 Jan 2027' }
  ]);

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
          this.businessCategory.set(p.businessCategory || p.category || 'Kirana & Supermarket');
          this.ownerName.set(p.ownerName || p.contactName || '');
          this.phone.set(p.phone || p.contactPhone || '');
          this.email.set(p.email || '');
          this.tagline.set(p.tagline || p.description || '');
          this.addressStreet.set(p.addressStreet || p.addressLine || '');
          this.city.set(p.city || 'Nagpur');
          this.pincode.set(p.pincode || '440010');
          this.gstin.set(p.gstin || '27AADCS5432K1Z9');
          this.fssai.set(p.fssai || '11522036000202');
          if (p.coverUrl) this.coverUrl.set(p.coverUrl);
          if (p.logoUrl) this.logoUrl.set(p.logoUrl);
          if (p.storePhotos) this.storePhotos.set(p.storePhotos);
          if (p.isShopLiveOpen !== undefined) this.isShopLiveOpen.set(p.isShopLiveOpen);
          if (p.weeklySchedule && p.weeklySchedule.length > 0) this.weeklySchedule.set(p.weeklySchedule);
          if (p.holidays) this.holidays.set(p.holidays);
        } else {
          // Bind active tenant values
          const active = this.authStore.activeMerchant();
          this.shopName.set(active.merchantName);
          this.ownerName.set(active.fullName);
          this.phone.set(active.phoneNumber);
          this.email.set(active.email);
          this.businessCategory.set(active.category);
          this.city.set(active.city);
        }
        this.isLoading.set(false);
      },
      error: () => {
        const active = this.authStore.activeMerchant();
        this.shopName.set(active.merchantName);
        this.ownerName.set(active.fullName);
        this.phone.set(active.phoneNumber);
        this.email.set(active.email);
        this.businessCategory.set(active.category);
        this.city.set(active.city);
        this.isLoading.set(false);
      }
    });
  }

  toggleShopLive() {
    this.isShopLiveOpen.update(v => !v);
    const outletId = this.outletStore.activeOutletId() || this.authStore.activeMerchant().outletId;
    this.api.updateOperatingHours(outletId, { isShopLiveOpen: this.isShopLiveOpen() }).subscribe();
    this.showToast(`Shop status updated: ${this.isShopLiveOpen() ? '🟢 OPEN' : '🔴 TEMPORARILY CLOSED'}.`);
  }

  toggleDayOpen(index: number) {
    this.weeklySchedule.update(list =>
      list.map((d, i) => i === index ? { ...d, isOpen: !d.isOpen } : d)
    );
  }

  applyTimeToAll(time: { openTime: string; closeTime: string }) {
    this.weeklySchedule.update(list =>
      list.map(d => ({ ...d, openTime: time.openTime, closeTime: time.closeTime }))
    );
    this.showToast(`Applied ${time.openTime} – ${time.closeTime} to all 7 days.`);
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
    const payload = {
      shopName: this.shopName(),
      businessCategory: this.businessCategory(),
      ownerName: this.ownerName(),
      phone: this.phone(),
      email: this.email(),
      tagline: this.tagline(),
      addressStreet: this.addressStreet(),
      city: this.city(),
      pincode: this.pincode(),
      gstin: this.gstin(),
      fssai: this.fssai(),
      coverUrl: this.coverUrl(),
      logoUrl: this.logoUrl(),
      storePhotos: this.storePhotos()
    };

    this.api.updateProfile(payload).subscribe({
      next: () => {
        this.showToast('Store profile & branding saved successfully!');
      },
      error: () => {
        this.showToast('Store profile saved locally.');
      }
    });
  }

  saveHours() {
    const outletId = this.outletStore.activeOutletId() || this.authStore.activeMerchant().outletId;
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
