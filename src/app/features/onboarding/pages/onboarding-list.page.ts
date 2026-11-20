import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BusinessRegistrationStore } from '../state/business-registration.store';
import { RegistrationHeaderComponent } from '../components/registration-header.component';
import { RegistrationStepperComponent } from '../components/registration-stepper.component';
import { MapPickerPreviewComponent } from '../components/map-picker-preview.component';
import { DocumentUploaderComponent } from '../components/document-uploader.component';
import { BusinessTypeId, ApplicationStatusCode } from '../models/business-registration.model';

@Component({
  selector: 'merchant-onboarding-list-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RegistrationHeaderComponent,
    RegistrationStepperComponent,
    MapPickerPreviewComponent,
    DocumentUploaderComponent
  ],
  templateUrl: './onboarding-list.page.html',
  styleUrls: ['./onboarding-list.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnboardingListPageComponent {
  readonly store = inject(BusinessRegistrationStore);
  private router = inject(Router);

  // Categories list for Business Information
  readonly categoryOptions: string[] = [
    'Grocery & Daily Needs',
    'Fruits & Vegetables',
    'Dairy & Bakery',
    'Pharmacy & Healthcare',
    'Snacks & Street Food',
    'Clothing & Apparel',
    'Electronics & Electricals',
    'Home & Kitchen',
    'Gifts & Stationery',
    'Personal Care & Beauty',
    'Hardware & Sanitary',
    'Other Neighbourhood Business'
  ];

  // States & Cities in India
  readonly stateOptions: string[] = ['Maharashtra', 'Gujarat', 'Karnataka', 'Delhi', 'Madhya Pradesh', 'Goa', 'Telangana'];
  readonly districtOptions: string[] = ['Akola', 'Amravati', 'Nagpur', 'Pune', 'Mumbai City', 'Mumbai Suburban', 'Thane', 'Nashik'];
  readonly cityOptions: string[] = ['Akola', 'Amravati', 'Nagpur', 'Pune', 'Mumbai', 'Thane', 'Nashik'];
  readonly localityOptions: string[] = ['Civil Lines', 'Main Market', 'Ramdas Peth', 'Gandhi Nagar', 'Jatharpeth', 'Gorakshan Road', 'Kaulkhed'];

  // Fulfilment Dropdown Options
  readonly serviceRadiusOptions: string[] = ['1 km', '2 km', '3 km', '5 km', '8 km', '10 km', '15 km', '20 km'];
  readonly prepTimeOptions: string[] = ['15 minutes', '20 minutes', '30 minutes', '45 minutes', '60 minutes', '90 minutes'];

  // Time Options for Business Hours
  readonly timeSlots: string[] = [
    '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM',
    '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM'
  ];

  // Holiday Modal State
  readonly isHolidayModalOpen = signal<boolean>(false);
  readonly newHolidayName = signal<string>('');
  readonly newHolidayDate = signal<string>('');

  // Temporary Closure Modal State
  readonly isClosureModalOpen = signal<boolean>(false);
  readonly closureStart = signal<string>('');
  readonly closureEnd = signal<string>('');
  readonly closureReason = signal<string>('Shop Renovation');

  // Copy Feedback
  readonly copiedAppId = signal<boolean>(false);

  // Validation state
  readonly validationMessage = signal<string | null>(null);

  readonly isCurrentStepValid = computed(() => {
    switch (this.store.currentStep()) {
      case 1: return this.store.isStep1Valid();
      case 2: return this.store.isStep2Valid();
      case 3: return this.store.isStep3Valid();
      case 4: return this.store.isStep4Valid();
      case 5: return this.store.isStep5Valid();
      case 6: return this.store.isStep6Valid();
      case 7: return this.store.isStep7Valid();
      default: return true;
    }
  });

  // Details Modal in Status Screen
  readonly isDetailsModalOpen = signal<boolean>(false);

  // Dynamic Header Title & Subtitle
  getHeaderTitle(): string {
    const s = this.store.currentStep();
    if (s <= 6) return 'Register Your Business';
    if (s === 7) return 'Review Your Registration';
    return 'Application Status';
  }

  getHeaderSubtitle(): string {
    const s = this.store.currentStep();
    if (s === 7) return 'Please review all your information. You can edit any section if needed before submitting.';
    if (s === 8) return 'Track your business registration and next steps.';
    return '';
  }

  // Navigation handlers
  onBack(): void {
    const cur = this.store.currentStep();
    if (cur === 1) {
      this.router.navigate(['/dashboard']);
    } else {
      this.store.prevStep();
    }
  }

  onNext(): void {
    if (!this.isCurrentStepValid()) {
      this.validationMessage.set('Please fill in all mandatory fields before proceeding.');
      return;
    }
    this.validationMessage.set(null);
    this.store.nextStep();
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  // Copy Application ID
  copyApplicationId(): void {
    const id = this.store.applicationId();
    navigator.clipboard?.writeText(id).catch(() => {});
    this.copiedAppId.set(true);
    setTimeout(() => this.copiedAppId.set(false), 2000);
  }

  // Modals
  openHolidayModal(): void {
    this.newHolidayName.set('');
    this.newHolidayDate.set('');
    this.isHolidayModalOpen.set(true);
  }

  closeHolidayModal(): void {
    this.isHolidayModalOpen.set(false);
  }

  saveHoliday(): void {
    if (this.newHolidayName().trim()) {
      const entry = `${this.newHolidayDate() || 'Upcoming'} (${this.newHolidayName()})`;
      this.store.hours.update(prev => ({
        ...prev,
        holidays: [...prev.holidays, entry]
      }));
      this.closeHolidayModal();
    }
  }

  openClosureModal(): void {
    this.isClosureModalOpen.set(true);
  }

  closeClosureModal(): void {
    this.isClosureModalOpen.set(false);
  }

  saveClosure(): void {
    this.store.hours.update(prev => ({
      ...prev,
      temporaryClosure: {
        startDate: this.closureStart() || 'Tomorrow',
        endDate: this.closureEnd() || 'Next Week',
        reason: this.closureReason()
      }
    }));
    this.closeClosureModal();
  }

  // File Upload Handlers
  onDocSelected(docId: string, event: { fileName: string; fileSize: string }): void {
    this.store.uploadDocument(docId, event.fileName, event.fileSize);
  }

  onDocRemoved(docId: string): void {
    this.store.removeDocument(docId);
  }

  onLicenceSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      this.store.uploadLicence(file.name, `${sizeMb} MB`);
    }
  }

  // Status simulation
  changeStatusPreview(code: ApplicationStatusCode): void {
    this.store.setPreviewStatus(code);
  }
}
