// Типы для системы бизнес-аккаунтов

export type BusinessTier = 'free' | 'lite' | 'business' | 'pro';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type TeamRole = 'owner' | 'admin' | 'manager';

export interface BusinessAccount {
  id: string;
  user_id: string;
  tier: BusinessTier;
  
  // Company info
  company_name: string;
  company_logo_url?: string;
  company_description?: string;
  company_address?: string;
  company_phone: string;
  company_email: string;
  company_website?: string;
  business_type: string; // 'car_dealer', 'horse_farm', 'realty', etc.
  
  // Working hours
  working_hours?: {
    [key: string]: { from: string; to: string };
  };
  
  // Verification (for PRO)
  is_verified: boolean;
  verification_documents?: string[];
  verification_status: VerificationStatus;
  
  // Subscription
  subscription_started_at: string;
  subscription_ends_at: string;
  trial_ends_at?: string;
  is_trial: boolean;
  auto_renew: boolean;
  
  // Limits
  active_listings_count: number;
  max_listings: number;
  team_members_count: number;
  max_team_members: number;
  
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  business_id: string;
  user_id: string;
  role: TeamRole;
  invited_at: string;
  accepted_at?: string;
}

export interface TierFeatures {
  tier: BusinessTier;
  name: string;
  price: number; // в сомах
  maxListings: number | 'unlimited';
  maxTeamMembers: number | 'unlimited';
  hasAnalytics: boolean;
  hasAdvancedAnalytics: boolean;
  hasLogo: boolean;
  hasDescription: boolean;
  hasPriorityBoost: number; // 0, 20, 50 (процент)
  hasBoostDiscount: number; // 0, 20, 30, 50 (процент)
  hasAutoRenew: boolean;
  hasTemplates: boolean;
  hasBulkUpload: boolean;
  hasVerification: boolean;
  hasBrandedPage: boolean;
  hasQRCode: boolean;
  hasBanner: boolean; // баннер в ленте
  features: string[];
}

export interface UpgradeReason {
  type: 'transport_limit' | 'horse_limit' | 'realty_limit' | 'tier_limit';
  currentCount: number;
  maxCount: number;
  suggestedTier: BusinessTier;
}

export interface LimitCheck {
  canCreate: boolean;
  reason?: UpgradeReason;
  currentCount: number;
  maxCount: number | 'unlimited';
}

// Константы тарифов
export const TIER_CONFIGS: Record<BusinessTier, TierFeatures> = {
  free: {
    tier: 'free',
    name: 'Базовый',
    price: 0,
    maxListings: 2,
    maxTeamMembers: 1,
    hasAnalytics: false,
    hasAdvancedAnalytics: false,
    hasLogo: false,
    hasDescription: false,
    hasPriorityBoost: 0,
    hasBoostDiscount: 0,
    hasAutoRenew: false,
    hasTemplates: false,
    hasBulkUpload: false,
    hasVerification: false,
    hasBrandedPage: false,
    hasQRCode: false,
    hasBanner: false,
    features: [
      'До 2 транспорта',
      'До 2 лошадей',
      'До 1 недвижимости',
    ],
  },
  lite: {
    tier: 'lite',
    name: 'Лайт',
    price: 300,
    maxListings: 10,
    maxTeamMembers: 1,
    hasAnalytics: true,
    hasAdvancedAnalytics: false,
    hasLogo: true,
    hasDescription: false,
    hasPriorityBoost: 0,
    hasBoostDiscount: 20,
    hasAutoRenew: false,
    hasTemplates: false,
    hasBulkUpload: false,
    hasVerification: false,
    hasBrandedPage: false,
    hasQRCode: false,
    hasBanner: false,
    features: [
      'До 10 активных объявлений',
      'Логотип компании',
      '1 менеджер',
      'Базовая аналитика',
      'Скидка на Boost -20%',
    ],
  },
  business: {
    tier: 'business',
    name: 'Бизнес',
    price: 500,
    maxListings: 30,
    maxTeamMembers: 3,
    hasAnalytics: true,
    hasAdvancedAnalytics: true,
    hasLogo: true,
    hasDescription: true,
    hasPriorityBoost: 20,
    hasBoostDiscount: 30,
    hasAutoRenew: true,
    hasTemplates: true,
    hasBulkUpload: false,
    hasVerification: false,
    hasBrandedPage: false,
    hasQRCode: false,
    hasBanner: false,
    features: [
      'До 30 активных объявлений',
      'Логотип + описание компании',
      'До 3 менеджеров',
      'Расширенная аналитика',
      'Приоритет в ленте +20%',
      'Автопродление',
      'Шаблоны объявлений',
      'Скидка на Boost -30%',
    ],
  },
  pro: {
    tier: 'pro',
    name: 'Профи',
    price: 1500,
    maxListings: 'unlimited',
    maxTeamMembers: 'unlimited',
    hasAnalytics: true,
    hasAdvancedAnalytics: true,
    hasLogo: true,
    hasDescription: true,
    hasPriorityBoost: 50,
    hasBoostDiscount: 50,
    hasAutoRenew: true,
    hasTemplates: true,
    hasBulkUpload: true,
    hasVerification: true,
    hasBrandedPage: true,
    hasQRCode: true,
    hasBanner: true,
    features: [
      'Безлимит объявлений',
      'Безлимит менеджеров',
      'Приоритет в ленте +50%',
      'Баннер в ленте (каждое 10-е видео)',
      'Bulk загрузка',
      'Верификация PRO (синий значок)',
      'Брендированная страница',
      'QR код + виджет сайта',
      'Скидка на Boost -50%',
    ],
  },
};

// Лимиты для FREE аккаунтов по категориям
export const FREE_LIMITS = {
  car: 2,
  horse: 2,
  realty: 1,
} as const;

