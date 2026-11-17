export type BusinessTypeId = 'retail' | 'home' | 'manufacturer' | 'seasonal' | 'event';

export interface BusinessTypeItem {
  id: BusinessTypeId;
  title: string;
  description: string;
  iconType: 'retail' | 'home' | 'factory' | 'calendar' | 'tent';
}

export interface BusinessDetails {
  businessName: string;
  ownerName: string;
  mobileNumber: string;
  email: string;
  category: string;
  description: string;
}

export interface BusinessLocation {
  pincode: string;
  state: string;
  district: string;
  city: string;
  locality: string;
  fullAddress: string;
  coordinates: { lat: number; lng: number };
  homeBusinessPrivacy: boolean;
}

export interface DaySchedule {
  day: string;
  short: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  breakTime: string;
}

export interface BusinessHoursConfig {
  scheduleMode: 'weekly' | 'same_every_day';
  days: DaySchedule[];
  holidays: string[];
  temporaryClosure?: {
    startDate: string;
    endDate: string;
    reason: string;
  };
}

export interface FulfilmentConfig {
  storePickup: boolean;
  merchantDelivery: boolean;
  serviceRadius: string;
  minOrderValue: number;
  prepTime: string;
}

export interface VerificationDocument {
  id: 'pan' | 'owner_id' | 'business_proof' | 'category_licence';
  title: string;
  subtitle: string;
  required: boolean;
  uploaded: boolean;
  fileName?: string;
  fileSize?: string;
}

export interface BankSettlementDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}

export type ApplicationStatusCode = 'under_review' | 'approved' | 'action_required' | 'rejected' | 'submitted';

export interface ApplicationStatusInfo {
  code: ApplicationStatusCode;
  title: string;
  description: string;
  applicationId: string;
  submittedAt: string;
  businessName: string;
  businessType: string;
  stepProgress: number; // 1 to 4
}
