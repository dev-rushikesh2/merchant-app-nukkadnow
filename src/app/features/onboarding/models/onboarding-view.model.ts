export type SellerMode = 'RETAIL' | 'HOME_MAKER' | 'STREET_HAWKER' | 'SERVICES';

export interface OnboardingDraft {
  step: number;
  sellerMode: SellerMode;
  businessName: string;
  category: string;
  description: string;
  isHomeMaker: boolean;
  locality: string;
  addressLine: string;
  landmark: string;
  pincode: string;
  pickupPointName: string;
  enablePickup: boolean;
  enableDelivery: boolean;
  deliveryRadiusKm: number;
  kycDocType: string;
  kycDocNumber: string;
  kycFileUrl?: string;
  bankAccountNumber: string;
  bankIfsc: string;
  termsAccepted: boolean;
}

export const EMPTY_REGISTRATION_DRAFT: OnboardingDraft = {
  step: 1,
  sellerMode: 'RETAIL',
  businessName: '',
  category: 'Grocery & Daily Needs',
  description: '',
  isHomeMaker: false,
  locality: 'Sitabuldi',
  addressLine: '',
  landmark: '',
  pincode: '440012',
  pickupPointName: '',
  enablePickup: true,
  enableDelivery: true,
  deliveryRadiusKm: 5,
  kycDocType: 'AADHAAR',
  kycDocNumber: '',
  bankAccountNumber: '',
  bankIfsc: '',
  termsAccepted: false
};

export type OnboardingViewModel = any;
