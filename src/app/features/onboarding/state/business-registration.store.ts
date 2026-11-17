import { Injectable, signal, computed, inject } from '@angular/core';
import {
  BusinessTypeId,
  BusinessTypeItem,
  BusinessDetails,
  BusinessLocation,
  BusinessHoursConfig,
  DaySchedule,
  FulfilmentConfig,
  VerificationDocument,
  BankSettlementDetails,
  ApplicationStatusCode,
  ApplicationStatusInfo
} from '../models/business-registration.model';
import { RegistrationApi, SaveDraftPayload } from '../data-access/registration.api';

@Injectable({
  providedIn: 'root'
})
export class BusinessRegistrationStore {
  private readonly registrationApi = inject(RegistrationApi);

  // Sync state
  readonly isSyncing = signal<boolean>(false);
  readonly syncError = signal<string | null>(null);

  // Navigation: Step 1 (Type) to 8 (Status)
  // 1: Business Type, 2: Details, 3: Location, 4: Hours, 5: Fulfilment, 6: Verify, 7: Review, 8: Status
  readonly currentStep = signal<number>(1);

  // Business Types Available
  readonly businessTypesList: BusinessTypeItem[] = [
    {
      id: 'retail',
      title: 'Retail Shop',
      description: 'A physical store like a grocery, bakery, pharmacy, clothing, etc.',
      iconType: 'retail'
    },
    {
      id: 'home',
      title: 'Home Business',
      description: 'Run a business from home, such as home bakery, tiffin, crafts, etc.',
      iconType: 'home'
    },
    {
      id: 'manufacturer',
      title: 'Manufacturer / Maker',
      description: 'Make or produce your own products, including handmade and small-scale goods.',
      iconType: 'factory'
    },
    {
      id: 'seasonal',
      title: 'Seasonal Seller',
      description: 'Sell for a limited period, such as festive, harvest or seasonal collections.',
      iconType: 'calendar'
    },
    {
      id: 'event',
      title: 'Event Seller',
      description: 'Sell at specific events, markets or exhibitions.',
      iconType: 'tent'
    }
  ];

  // 1. Selected Business Type
  readonly selectedBusinessType = signal<BusinessTypeId>('retail');

  // 2. Business Information / Details
  readonly details = signal<BusinessDetails>({
    businessName: 'Sharma General Store',
    ownerName: 'Rajesh Sharma',
    mobileNumber: '+91 98765 43210',
    email: 'rajesh@store.com',
    category: 'Grocery & Daily Needs',
    description: 'A neighbourhood grocery store offering daily essentials, household items and personal care products.'
  });

  // 3. Business Location
  readonly location = signal<BusinessLocation>({
    pincode: '442001',
    state: 'Maharashtra',
    district: 'Akola',
    city: 'Akola',
    locality: 'Civil Lines',
    fullAddress: 'Shop No. 12, Main Market Road, Civil Lines, Akola - 442001',
    coordinates: { lat: 20.7002, lng: 77.0082 },
    homeBusinessPrivacy: true
  });

  // 4. Business Hours
  readonly hours = signal<BusinessHoursConfig>({
    scheduleMode: 'weekly',
    days: [
      { day: 'Monday', short: 'Mon', isOpen: true, openTime: '09:00 AM', closeTime: '09:00 PM', breakTime: '01:00 - 02:00 PM' },
      { day: 'Tuesday', short: 'Tue', isOpen: true, openTime: '09:00 AM', closeTime: '09:00 PM', breakTime: '01:00 - 02:00 PM' },
      { day: 'Wednesday', short: 'Wed', isOpen: true, openTime: '09:00 AM', closeTime: '09:00 PM', breakTime: '01:00 - 02:00 PM' },
      { day: 'Thursday', short: 'Thu', isOpen: true, openTime: '09:00 AM', closeTime: '09:00 PM', breakTime: '01:00 - 02:00 PM' },
      { day: 'Friday', short: 'Fri', isOpen: true, openTime: '09:00 AM', closeTime: '09:00 PM', breakTime: '01:00 - 02:00 PM' },
      { day: 'Saturday', short: 'Sat', isOpen: true, openTime: '09:00 AM', closeTime: '10:00 PM', breakTime: '01:00 - 02:00 PM' },
      { day: 'Sunday', short: 'Sun', isOpen: false, openTime: '09:00 AM', closeTime: '09:00 PM', breakTime: '01:00 - 02:00 PM' }
    ],
    holidays: ['26 Jan (Republic Day)', '15 Aug (Independence Day)', '02 Oct (Gandhi Jayanti)'],
    temporaryClosure: undefined
  });

  // 5. Fulfilment Configuration
  readonly fulfilment = signal<FulfilmentConfig>({
    storePickup: true,
    merchantDelivery: true,
    serviceRadius: '5 km',
    minOrderValue: 300,
    prepTime: '30 minutes'
  });

  // 6. Verification Documents & Bank Settlement
  readonly documents = signal<VerificationDocument[]>([
    {
      id: 'pan',
      title: 'PAN Card',
      subtitle: 'Business or owner PAN card (PDF/JPG, Max 5 MB)',
      required: true,
      uploaded: true,
      fileName: 'PAN_RAJESH_SHARMA.pdf',
      fileSize: '1.2 MB'
    },
    {
      id: 'owner_id',
      title: 'Identity Proof (Owner)',
      subtitle: 'Aadhaar / Voter ID / Driving Licence',
      required: true,
      uploaded: true,
      fileName: 'AADHAAR_CARD.jpg',
      fileSize: '2.4 MB'
    },
    {
      id: 'business_proof',
      title: 'Business Proof',
      subtitle: 'Shop Act / Udyam / GST / Registration / Rent Agreement / Utility Bill (any one)',
      required: true,
      uploaded: true,
      fileName: 'SHOP_ACT_REGISTRATION.pdf',
      fileSize: '1.8 MB'
    }
  ]);

  readonly bankDetails = signal<BankSettlementDetails>({
    accountHolderName: 'Rajesh Sharma',
    accountNumber: '**********9012',
    ifscCode: 'HDFC0001234',
    bankName: 'HDFC Bank'
  });

  readonly optionalLicence = signal<{ uploaded: boolean; fileName?: string; fileSize?: string }>({
    uploaded: false
  });

  // 7. Terms & Conditions Agreement
  readonly termsAgreed = signal<boolean>(true);

  // 8. Application Status State
  readonly activePreviewStatus = signal<ApplicationStatusCode>('under_review');
  readonly applicationId = signal<string>('NN-MR-20261115-0387');
  readonly submittedTimestamp = signal<string>('15 Nov 2026, 10:24 AM');

  // Computed Helpers
  readonly selectedTypeItem = computed(() => {
    const id = this.selectedBusinessType();
    return this.businessTypesList.find(t => t.id === id) || this.businessTypesList[0];
  });

  readonly businessHoursSummary = computed(() => {
    const list = this.hours().days;
    const openDays = list.filter(d => d.isOpen);
    const closedDays = list.filter(d => !d.isOpen);

    if (openDays.length === 0) return 'Currently closed on all days';

    const closedText = closedDays.length > 0 ? `Closed: ${closedDays.map(d => d.short).join(', ')}` : 'Open all 7 days';
    return `Open: Mon – Sat (9:00 AM – 9:00 PM, Sat till 10:00 PM) | ${closedText}`;
  });

  readonly fulfilmentSummaryText = computed(() => {
    const f = this.fulfilment();
    const modes: string[] = [];
    if (f.storePickup) modes.push('Store Pickup');
    if (f.merchantDelivery) modes.push(`Merchant Delivery`);
    return modes.join(' + ') || 'No fulfilment method selected';
  });

  readonly isStep1Valid = computed(() => !!this.selectedBusinessType());
  readonly isStep2Valid = computed(() => {
    const d = this.details();
    return d.businessName.trim().length > 0 && d.ownerName.trim().length > 0 && d.mobileNumber.trim().length >= 10;
  });
  readonly isStep3Valid = computed(() => {
    const l = this.location();
    return l.pincode.trim().length >= 6 && l.fullAddress.trim().length > 0;
  });
  readonly isStep4Valid = computed(() => {
    return this.hours().days.some(d => d.isOpen);
  });
  readonly isStep5Valid = computed(() => {
    const f = this.fulfilment();
    return f.storePickup || f.merchantDelivery;
  });
  readonly isStep6Valid = computed(() => {
    const docs = this.documents();
    const allRequiredUploaded = docs.every(d => !d.required || d.uploaded);
    const b = this.bankDetails();
    const bankFilled = b.accountHolderName.trim().length > 0 && b.accountNumber.trim().length > 0 && b.ifscCode.trim().length > 0;
    return allRequiredUploaded && bankFilled;
  });
  readonly isStep7Valid = computed(() => this.termsAgreed());

  // Actions
  setBusinessType(id: BusinessTypeId): void {
    this.selectedBusinessType.set(id);
    this.persistDraft();
  }

  updateDetails(partial: Partial<BusinessDetails>): void {
    this.details.update(prev => ({ ...prev, ...partial }));
  }

  updateLocation(partial: Partial<BusinessLocation>): void {
    this.location.update(prev => ({ ...prev, ...partial }));
  }

  toggleHomeBusinessPrivacy(): void {
    this.location.update(prev => ({ ...prev, homeBusinessPrivacy: !prev.homeBusinessPrivacy }));
    this.persistDraft();
  }

  toggleDay(short: string): void {
    this.hours.update(prev => ({
      ...prev,
      days: prev.days.map(d => (d.short === short ? { ...d, isOpen: !d.isOpen } : d))
    }));
  }

  setScheduleMode(mode: 'weekly' | 'same_every_day'): void {
    this.hours.update(prev => {
      if (mode === 'same_every_day') {
        const mon = prev.days[0];
        return {
          ...prev,
          scheduleMode: mode,
          days: prev.days.map((d, i) => i === 6 ? d : { ...d, isOpen: mon.isOpen, openTime: mon.openTime, closeTime: mon.closeTime })
        };
      }
      return { ...prev, scheduleMode: mode };
    });
    this.persistDraft();
  }

  updateDayHours(short: string, field: 'openTime' | 'closeTime' | 'breakTime', val: string): void {
    this.hours.update(prev => ({
      ...prev,
      days: prev.days.map(d => (d.short === short ? { ...d, [field]: val } : d))
    }));
  }

  toggleStorePickup(): void {
    this.fulfilment.update(prev => ({ ...prev, storePickup: !prev.storePickup }));
    this.persistDraft();
  }

  toggleMerchantDelivery(): void {
    this.fulfilment.update(prev => ({ ...prev, merchantDelivery: !prev.merchantDelivery }));
    this.persistDraft();
  }

  updateFulfilment(partial: Partial<FulfilmentConfig>): void {
    this.fulfilment.update(prev => ({ ...prev, ...partial }));
  }

  uploadDocument(docId: string, fileName: string, fileSize: string = '1.5 MB'): void {
    this.documents.update(prev =>
      prev.map(d => (d.id === docId ? { ...d, uploaded: true, fileName, fileSize } : d))
    );
    const doc = this.documents().find(d => d.id === docId);
    if (doc) {
      const typeMap: Record<string, string> = {
        pan: 'PAN',
        owner_id: 'OWNER_ID',
        business_proof: 'BUSINESS_PROOF'
      };
      this.registrationApi.uploadDocument(this.applicationId(), {
        documentType: typeMap[docId] || 'BUSINESS_PROOF',
        fileName,
        fileUrl: `https://storage.nukkadnow.internal/docs/${fileName}`,
        fileSize
      }).subscribe();
    }
  }

  removeDocument(docId: string): void {
    this.documents.update(prev =>
      prev.map(d => (d.id === docId ? { ...d, uploaded: false, fileName: undefined, fileSize: undefined } : d))
    );
  }

  uploadLicence(fileName: string, fileSize: string = '2.1 MB'): void {
    this.optionalLicence.set({ uploaded: true, fileName, fileSize });
    this.registrationApi.uploadDocument(this.applicationId(), {
      documentType: 'CATEGORY_LICENCE',
      fileName,
      fileUrl: `https://storage.nukkadnow.internal/docs/${fileName}`,
      fileSize
    }).subscribe();
  }

  removeLicence(): void {
    this.optionalLicence.set({ uploaded: false });
  }

  updateBankDetails(partial: Partial<BankSettlementDetails>): void {
    this.bankDetails.update(prev => ({ ...prev, ...partial }));
  }

  toggleTerms(): void {
    this.termsAgreed.update(v => !v);
  }

  setPreviewStatus(code: ApplicationStatusCode): void {
    this.activePreviewStatus.set(code);
    // Sync verification status with backend for audit tracking
    const statusMap: Record<ApplicationStatusCode, string> = {
      submitted: 'SUBMITTED',
      under_review: 'UNDER_REVIEW',
      action_required: 'ACTION_REQUIRED',
      approved: 'APPROVED',
      rejected: 'REJECTED'
    };
    this.registrationApi.updateStatus(this.applicationId(), statusMap[code]).subscribe();
  }

  nextStep(): void {
    const next = this.currentStep() + 1;
    if (next <= 8) {
      this.currentStep.set(next);
      this.persistDraft();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevStep(): void {
    const prev = this.currentStep() - 1;
    if (prev >= 1) {
      this.currentStep.set(prev);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= 8) {
      this.currentStep.set(step);
      this.persistDraft();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Persists draft registration data to backend DB via API Gateway
   */
  persistDraft(): void {
    const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const payload: SaveDraftPayload = {
      applicationId: this.applicationId(),
      currentStep: this.currentStep(),
      businessType: this.selectedBusinessType(),
      businessName: this.details().businessName,
      ownerName: this.details().ownerName,
      mobileNumber: this.details().mobileNumber,
      email: this.details().email,
      businessCategory: this.details().category,
      businessDescription: this.details().description,
      pincode: this.location().pincode,
      state: this.location().state,
      district: this.location().district,
      city: this.location().city,
      locality: this.location().locality,
      fullAddress: this.location().fullAddress,
      latitude: this.location().coordinates.lat,
      longitude: this.location().coordinates.lng,
      homeBusinessPrivacy: this.location().homeBusinessPrivacy,
      scheduleMode: this.hours().scheduleMode,
      operatingHours: this.hours().days.map(d => ({
        dayOfWeek: dayMap.indexOf(d.short),
        dayShort: d.short,
        isOpen: d.isOpen,
        openTime: d.openTime,
        closeTime: d.closeTime,
        breakTime: d.breakTime
      })),
      holidays: this.hours().holidays,
      storePickup: this.fulfilment().storePickup,
      merchantDelivery: this.fulfilment().merchantDelivery,
      serviceRadius: this.fulfilment().serviceRadius,
      minOrderValue: this.fulfilment().minOrderValue,
      prepTime: this.fulfilment().prepTime,
      bankAccountHolder: this.bankDetails().accountHolderName,
      bankAccountNumber: this.bankDetails().accountNumber,
      bankIfscCode: this.bankDetails().ifscCode,
      bankName: this.bankDetails().bankName,
    };

    this.isSyncing.set(true);
    this.registrationApi.saveDraft(payload).subscribe({
      next: res => {
        this.isSyncing.set(false);
        if (res?.applicationId && res.applicationId !== this.applicationId()) {
          this.applicationId.set(res.applicationId);
        }
      },
      error: err => {
        this.isSyncing.set(false);
        this.syncError.set('Could not sync with cloud, saved locally');
      }
    });
  }

  /**
   * Final Submission to Backend Database
   */
  submitRegistration(): void {
    const now = new Date();
    const formatted = `${now.getDate()} Nov ${now.getFullYear()}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    this.submittedTimestamp.set(formatted);
    this.currentStep.set(8);
    this.activePreviewStatus.set('under_review');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    this.isSyncing.set(true);
    this.registrationApi.submit(this.applicationId(), this.termsAgreed()).subscribe({
      next: res => {
        this.isSyncing.set(false);
        if (res?.applicationId) {
          this.applicationId.set(res.applicationId);
        }
      },
      error: err => {
        this.isSyncing.set(false);
      }
    });
  }

  /**
   * Loads complete preset data for a selected merchant and synchronizes with backend
   */
  loadMerchantPreset(tenantId: string): void {
    if (tenantId === 'merchant-sabji-001') {
      this.selectedBusinessType.set('retail');
      this.details.set({
        businessName: 'Patil Fresh Sabji Mandi',
        ownerName: 'Vinod Patil',
        mobileNumber: '+91 98230 11223',
        email: 'vinod.patil@patilsabji.com',
        category: 'Vegetables & Fruits',
        description: 'Direct farm-sourced daily fresh vegetables, green leafy veggies, herbs, ginger, garlic and seasonal fruits from local Vidarbha farmers.'
      });
      this.location.set({
        pincode: '440012',
        state: 'Maharashtra',
        district: 'Nagpur',
        city: 'Nagpur',
        locality: 'Sitabuldi',
        fullAddress: 'Shop No. 4, Wholesale Sabji Mandi, Sitabuldi, Nagpur, Maharashtra - 440012',
        coordinates: { lat: 21.1466, lng: 79.0833 },
        homeBusinessPrivacy: false
      });
      this.hours.set({
        scheduleMode: 'weekly',
        days: [
          { day: 'Monday', short: 'Mon', isOpen: true, openTime: '06:00 AM', closeTime: '08:30 PM', breakTime: '01:00 - 02:00 PM' },
          { day: 'Tuesday', short: 'Tue', isOpen: true, openTime: '06:00 AM', closeTime: '08:30 PM', breakTime: '01:00 - 02:00 PM' },
          { day: 'Wednesday', short: 'Wed', isOpen: true, openTime: '06:00 AM', closeTime: '08:30 PM', breakTime: '01:00 - 02:00 PM' },
          { day: 'Thursday', short: 'Thu', isOpen: true, openTime: '06:00 AM', closeTime: '08:30 PM', breakTime: '01:00 - 02:00 PM' },
          { day: 'Friday', short: 'Fri', isOpen: true, openTime: '06:00 AM', closeTime: '08:30 PM', breakTime: '01:00 - 02:00 PM' },
          { day: 'Saturday', short: 'Sat', isOpen: true, openTime: '06:00 AM', closeTime: '09:00 PM', breakTime: '01:00 - 02:00 PM' },
          { day: 'Sunday', short: 'Sun', isOpen: true, openTime: '06:00 AM', closeTime: '08:30 PM' }
        ],
        holidays: ['26 Jan (Republic Day)', '15 Aug (Independence Day)']
      });
      this.fulfilment.set({
        storePickup: true,
        merchantDelivery: true,
        serviceRadius: '6 km',
        minOrderValue: 100,
        prepTime: '15 minutes'
      });
      this.bankDetails.set({
        accountHolderName: 'Vinod Patil',
        accountNumber: '**********3341',
        ifscCode: 'SBIN0000432',
        bankName: 'State Bank of India'
      });
      this.applicationId.set('NN-MR-20261114-1101');
      this.activePreviewStatus.set('approved');
      this.loadRegistration('NN-MR-20261114-1101');
    } else if (tenantId === 'merchant-kirana-002') {
      this.selectedBusinessType.set('retail');
      this.details.set({
        businessName: 'Sharma Kirana & General Store',
        ownerName: 'Rajesh Sharma',
        mobileNumber: '+91 98765 43210',
        email: 'rajesh@sharmakirana.com',
        category: 'Grocery & Daily Needs',
        description: 'A neighbourhood grocery store offering daily essentials, spices, pulses, rice, edible oils, dairy, household items and personal care products.'
      });
      this.location.set({
        pincode: '442001',
        state: 'Maharashtra',
        district: 'Akola',
        city: 'Akola',
        locality: 'Civil Lines',
        fullAddress: 'Shop No. 12, Main Market Road, Civil Lines, Akola, Maharashtra - 442001',
        coordinates: { lat: 20.7002, lng: 77.0082 },
        homeBusinessPrivacy: false
      });
      this.hours.set({
        scheduleMode: 'weekly',
        days: [
          { day: 'Monday', short: 'Mon', isOpen: true, openTime: '09:00 AM', closeTime: '09:00 PM', breakTime: '01:00 - 02:00 PM' },
          { day: 'Tuesday', short: 'Tue', isOpen: true, openTime: '09:00 AM', closeTime: '09:00 PM', breakTime: '01:00 - 02:00 PM' },
          { day: 'Wednesday', short: 'Wed', isOpen: true, openTime: '09:00 AM', closeTime: '09:00 PM', breakTime: '01:00 - 02:00 PM' },
          { day: 'Thursday', short: 'Thu', isOpen: true, openTime: '09:00 AM', closeTime: '09:00 PM', breakTime: '01:00 - 02:00 PM' },
          { day: 'Friday', short: 'Fri', isOpen: true, openTime: '09:00 AM', closeTime: '09:00 PM', breakTime: '01:00 - 02:00 PM' },
          { day: 'Saturday', short: 'Sat', isOpen: true, openTime: '09:00 AM', closeTime: '10:00 PM', breakTime: '01:00 - 02:00 PM' },
          { day: 'Sunday', short: 'Sun', isOpen: false, openTime: '09:00 AM', closeTime: '09:00 PM' }
        ],
        holidays: ['26 Jan (Republic Day)', '15 Aug (Independence Day)', '02 Oct (Gandhi Jayanti)']
      });
      this.fulfilment.set({
        storePickup: true,
        merchantDelivery: true,
        serviceRadius: '5 km',
        minOrderValue: 300,
        prepTime: '30 minutes'
      });
      this.bankDetails.set({
        accountHolderName: 'Rajesh Sharma',
        accountNumber: '**********9012',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank'
      });
      this.applicationId.set('NN-MR-20261115-0387');
      this.activePreviewStatus.set('approved');
      this.loadRegistration('NN-MR-20261115-0387');
    } else if (tenantId === 'merchant-garguti-003') {
      this.selectedBusinessType.set('home');
      this.details.set({
        businessName: 'Garguti Homemade Chivda & Snacks',
        ownerName: 'Sunita Kulkarni',
        mobileNumber: '+91 98221 44556',
        email: 'sunita.kulkarni@gargutichivda.in',
        category: 'Home Bakery & Traditional Snacks',
        description: 'Authentic homemade Vidarbha special spicy poha chivda, bakarwadi, cornflakes chivda, chakli, besan laddoo and traditional festive faral made with pure groundnut oil and family secret spices.'
      });
      this.location.set({
        pincode: '442005',
        state: 'Maharashtra',
        district: 'Akola',
        city: 'Akola',
        locality: 'Ramdaspeth',
        fullAddress: 'Flat 302, Radha Krishna Heights, Ramdaspeth, Akola, Maharashtra - 442005',
        coordinates: { lat: 20.6975, lng: 77.0012 },
        homeBusinessPrivacy: true // Protected address!
      });
      this.hours.set({
        scheduleMode: 'weekly',
        days: [
          { day: 'Monday', short: 'Mon', isOpen: true, openTime: '10:00 AM', closeTime: '07:00 PM' },
          { day: 'Tuesday', short: 'Tue', isOpen: true, openTime: '10:00 AM', closeTime: '07:00 PM' },
          { day: 'Wednesday', short: 'Wed', isOpen: true, openTime: '10:00 AM', closeTime: '07:00 PM' },
          { day: 'Thursday', short: 'Thu', isOpen: true, openTime: '10:00 AM', closeTime: '07:00 PM' },
          { day: 'Friday', short: 'Fri', isOpen: true, openTime: '10:00 AM', closeTime: '07:00 PM' },
          { day: 'Saturday', short: 'Sat', isOpen: true, openTime: '10:00 AM', closeTime: '07:00 PM' },
          { day: 'Sunday', short: 'Sun', isOpen: true, openTime: '11:00 AM', closeTime: '04:00 PM' }
        ],
        holidays: []
      });
      this.fulfilment.set({
        storePickup: true,
        merchantDelivery: true,
        serviceRadius: '10 km',
        minOrderValue: 200,
        prepTime: '45 minutes'
      });
      this.bankDetails.set({
        accountHolderName: 'Sunita Kulkarni',
        accountNumber: '**********6789',
        ifscCode: 'MAHB0000123',
        bankName: 'Bank of Maharashtra'
      });
      this.applicationId.set('NN-MR-20261116-2244');
      this.activePreviewStatus.set('approved');
      this.loadRegistration('NN-MR-20261116-2244');
    } else if (tenantId === 'merchant-sweets-004') {
      this.selectedBusinessType.set('retail');
      this.details.set({
        businessName: 'Mahalaxmi Sweets, Dairy & Bakery',
        ownerName: 'Anand Joshi',
        mobileNumber: '+91 98900 77889',
        email: 'anand.joshi@mahalaxmisweets.com',
        category: 'Dairy, Sweets & Bakery',
        description: 'Renowned authentic Nagpur orange barfi, motichoor laddoo, fresh buffalo paneer, pure cow ghee, daily milk, hot jalebi and artisan sourdough breads.'
      });
      this.location.set({
        pincode: '440010',
        state: 'Maharashtra',
        district: 'Nagpur',
        city: 'Nagpur',
        locality: 'Dharampeth',
        fullAddress: 'Plot 18, West High Court Road, Dharampeth, Nagpur, Maharashtra - 440010',
        coordinates: { lat: 21.1408, lng: 79.0620 },
        homeBusinessPrivacy: false
      });
      this.hours.set({
        scheduleMode: 'weekly',
        days: [
          { day: 'Monday', short: 'Mon', isOpen: true, openTime: '07:30 AM', closeTime: '10:30 PM' },
          { day: 'Tuesday', short: 'Tue', isOpen: true, openTime: '07:30 AM', closeTime: '10:30 PM' },
          { day: 'Wednesday', short: 'Wed', isOpen: true, openTime: '07:30 AM', closeTime: '10:30 PM' },
          { day: 'Thursday', short: 'Thu', isOpen: true, openTime: '07:30 AM', closeTime: '10:30 PM' },
          { day: 'Friday', short: 'Fri', isOpen: true, openTime: '07:30 AM', closeTime: '10:30 PM' },
          { day: 'Saturday', short: 'Sat', isOpen: true, openTime: '07:30 AM', closeTime: '11:00 PM' },
          { day: 'Sunday', short: 'Sun', isOpen: true, openTime: '07:30 AM', closeTime: '10:30 PM' }
        ],
        holidays: []
      });
      this.fulfilment.set({
        storePickup: true,
        merchantDelivery: true,
        serviceRadius: '8 km',
        minOrderValue: 250,
        prepTime: '20 minutes'
      });
      this.bankDetails.set({
        accountHolderName: 'Mahalaxmi Food LLP',
        accountNumber: '**********5512',
        ifscCode: 'UTIB0000045',
        bankName: 'Axis Bank'
      });
      this.applicationId.set('NN-MR-20261117-4912');
      this.activePreviewStatus.set('approved');
      this.loadRegistration('NN-MR-20261117-4912');
    }
  }

  /**
   * Dynamic DB status loader
   */
  loadRegistration(identifier: string): void {
    this.isSyncing.set(true);
    this.registrationApi.getStatus(identifier).subscribe({
      next: res => {
        this.isSyncing.set(false);
        if (res?.applicationId) {
          this.applicationId.set(res.applicationId);
        }
        if (res?.status) {
          const map: Record<string, ApplicationStatusCode> = {
            'SUBMITTED': 'under_review',
            'UNDER_REVIEW': 'under_review',
            'ACTION_REQUIRED': 'action_required',
            'APPROVED': 'approved',
            'REJECTED': 'rejected'
          };
          this.activePreviewStatus.set(map[res.status] || 'under_review');
        }
        if (res?.currentStep) {
          this.currentStep.set(res.currentStep);
        }
      },
      error: () => {
        this.isSyncing.set(false);
      }
    });
  }
}
