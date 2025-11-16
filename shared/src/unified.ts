// ============================================
// 360AutoMVP Unified Types Package
// Version: 2.0 - Production Ready
// ============================================

// ============================================
// 1. CORE ENTITIES
// ============================================

export type ListingCategory = 'car' | 'horse' | 'real_estate';
export type ListingStatus = 'draft' | 'pending_review' | 'active' | 'sold' | 'archived' | 'expired' | 'rejected';
export type BusinessTier = 'free' | 'lite' | 'business' | 'pro';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type TeamRole = 'owner' | 'admin' | 'manager';
export type BoostType = 'basic' | 'top' | 'premium';
export type MessageType = 'text' | 'image' | 'offer' | 'system';
export type NotificationType = 'like' | 'comment' | 'message' | 'boost_expired' | 'moderation' | 'system';

// ============================================
// 2. USER ENTITIES
// ============================================

export interface User {
  id: string;
  phone: string;
  name: string;
  avatar_url?: string;
  
  // Verification & Status
  is_verified: boolean;
  is_blocked: boolean;
  blocked_reason?: string;
  blocked_at?: string;
  
  // Stats
  rating: number;
  total_sales: number;
  total_purchases: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface BusinessAccount {
  id: string;
  user_id: string;
  tier: BusinessTier;
  
  // Company Info
  company_name: string;
  company_logo_url?: string;
  company_description?: string;
  company_address?: string;
  company_phone: string;
  company_email: string;
  company_website?: string;
  business_type: string;
  
  // Working Hours
  working_hours?: Record<string, { from: string; to: string }>;
  
  // Verification
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
  invited_by: string;
  
  // Relations
  user?: User;
  business?: BusinessAccount;
}

// ============================================
// 3. LISTING ENTITIES
// ============================================

export interface CarDetails {
  brand: string;
  model: string;
  year: number;
  mileage: number;
  transmission?: 'manual' | 'automatic' | 'cvt';
  fuel_type?: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  color?: string;
  body_type?: string;
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  vin?: string;
  license_plate?: string;
  owners_count?: number;
  additional_images?: string[];
}

export interface HorseDetails {
  breed: string;
  age: number;
  gender: 'stallion' | 'mare' | 'gelding';
  color: string;
  height: number;
  training: 'trained' | 'untrained' | 'partial';
  purpose: 'racing' | 'riding' | 'breeding' | 'sport' | 'other';
  pedigree: boolean;
  health_certificate: boolean;
  temperament?: string;
  vaccinations?: string[];
  achievements?: string[];
}

export interface RealEstateDetails {
  property_type: 'apartment' | 'house' | 'commercial' | 'land';
  rooms?: number;
  area: number;
  floor?: number;
  total_floors?: number;
  year_built?: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  features?: string[];
  utilities?: string[];
  parking?: boolean;
  balcony?: boolean;
  garden?: boolean;
}

export interface Listing {
  id: string;
  
  // Category & Business
  category: ListingCategory;
  business_id?: string;
  
  // Seller
  seller_id: string;
  seller?: User;
  business?: BusinessAccount;
  
  // Video & Media
  video_id: string;
  video_url: string;
  thumbnail_url?: string;
  additional_images?: string[];
  
  // Basic Info
  title: string;
  description?: string;
  price: number;
  currency: string;
  city?: string;
  location?: string;
  
  // Status & Dates
  status: ListingStatus;
  created_at: string;
  updated_at: string;
  published_at?: string;
  sold_at?: string;
  expires_at?: string;
  delete_at?: string;
  
  // Stats
  views: number;
  likes: number;
  shares: number;
  saves: number;
  messages_count: number;
  
  // AI Analysis
  ai_score?: number;
  ai_condition?: 'excellent' | 'good' | 'fair' | 'poor';
  ai_damages?: Damage[];
  ai_features?: string[];
  ai_analysis_text?: string;
  ai_estimated_price?: {
    min: number;
    max: number;
  };
  
  // Category-specific details
  details: CarDetails | HorseDetails | RealEstateDetails;
  
  // Boost/Promotion
  is_promoted: boolean;
  boost_type?: BoostType;
  boost_expires_at?: string;
  boost_activated_at?: string;
  views_before_boost?: number;
  
  // Moderation
  moderation_status: 'pending' | 'approved' | 'rejected';
  moderation_notes?: string;
  moderated_by?: string;
  moderated_at?: string;
  
  // UI State (not persisted)
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface Damage {
  type: string;
  severity: 'minor' | 'moderate' | 'major' | 'severe' | 'critical';
  location: string;
  confidence: number;
}

// ============================================
// 4. CHAT SYSTEM
// ============================================

export interface ChatThread {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  business_id?: string;
  
  // Thread Info
  last_message?: string;
  last_message_at: string;
  is_active: boolean;
  unread_count_buyer: number;
  unread_count_seller: number;
  
  // Relations
  listing?: Listing;
  buyer?: User;
  seller?: User;
  business?: BusinessAccount;
  
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  message: string;
  message_type: MessageType;
  offer_amount?: number;
  is_read: boolean;
  read_at?: string;
  
  // Relations
  sender?: User;
  thread?: ChatThread;
  
  created_at: string;
}

// ============================================
// 5. BOOST/PROMOTION SYSTEM
// ============================================

export interface Promotion {
  id: string;
  listing_id: string;
  user_id: string;
  business_id?: string;
  
  // Promotion Details
  boost_type: BoostType;
  duration_days: number;
  price: number;
  currency: string;
  
  // Status
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  activated_at?: string;
  expires_at?: string;
  
  // Payment
  payment_id?: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  
  created_at: string;
  updated_at: string;
}

// ============================================
// 6. MODERATION SYSTEM
// ============================================

export interface ModerationQueue {
  id: string;
  listing_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Moderation Details
  flagged_reasons?: string[];
  ai_confidence?: number;
  human_review_required: boolean;
  
  // Reviewer
  assigned_to?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  
  created_at: string;
  updated_at: string;
}

// ============================================
// 7. NOTIFICATIONS
// ============================================

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  read_at?: string;
  
  created_at: string;
}

// ============================================
// 8. ANALYTICS & TRACKING
// ============================================

export interface View {
  id: string;
  listing_id: string;
  user_id?: string;
  session_id?: string;
  viewed_at: string;
}

export interface Like {
  id: string;
  user_id?: string;
  listing_id: string;
  created_at: string;
}

export interface Save {
  id: string;
  user_id: string;
  listing_id: string;
  notes?: string;
  created_at: string;
}

// ============================================
// 9. PAYMENT SYSTEM
// ============================================

export interface Payment {
  id: string;
  user_id: string;
  business_id?: string;
  
  // Payment Details
  amount: number;
  currency: string;
  payment_type: 'boost' | 'subscription' | 'feature';
  payment_method: 'card' | 'bank_transfer' | 'mobile_money';
  
  // Transaction
  transaction_id?: string;
  external_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  
  // Metadata
  metadata?: Record<string, any>;
  description?: string;
  
  created_at: string;
  updated_at: string;
}

// ============================================
// 10. API RESPONSES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  requestId?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================
// 11. TYPE GUARDS
// ============================================

export function isCarListing(listing: Listing): listing is Listing & { details: CarDetails } {
  return listing.category === 'car';
}

export function isHorseListing(listing: Listing): listing is Listing & { details: HorseDetails } {
  return listing.category === 'horse';
}

export function isRealEstateListing(listing: Listing): listing is Listing & { details: RealEstateDetails } {
  return listing.category === 'real_estate';
}

// ============================================
// 12. BUSINESS TIER CONFIGURATION
// ============================================

export interface TierFeatures {
  tier: BusinessTier;
  name: string;
  price: number;
  maxListings: number | 'unlimited';
  maxTeamMembers: number | 'unlimited';
  hasAnalytics: boolean;
  hasAdvancedAnalytics: boolean;
  hasLogo: boolean;
  hasDescription: boolean;
  hasPriorityBoost: number;
  hasBoostDiscount: number;
  hasAutoRenew: boolean;
  hasTemplates: boolean;
  hasBulkUpload: boolean;
  hasVerification: boolean;
  hasBrandedPage: boolean;
  hasQRCode: boolean;
  hasBanner: boolean;
  features: string[];
}

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
    features: ['До 2 объявлений', 'Базовая поддержка'],
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
    features: ['До 10 объявлений', 'Логотип компании', 'Базовая аналитика', 'Скидка на Boost -20%'],
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
    features: ['До 30 объявлений', 'Логотип + описание', 'До 3 менеджеров', 'Расширенная аналитика', 'Приоритет +20%', 'Шаблоны', 'Скидка на Boost -30%'],
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
    features: ['Безлимит объявлений', 'Безлимит менеджеров', 'Приоритет +50%', 'Bulk загрузка', 'Верификация PRO', 'Брендированная страница', 'QR код', 'Скидка на Boost -50%'],
  },
};

// ============================================
// 13. SEARCH & FILTERS
// ============================================

export interface SearchFilters {
  category?: ListingCategory;
  status?: ListingStatus;
  priceMin?: number;
  priceMax?: number;
  location?: string;
  city?: string;
  yearMin?: number;
  yearMax?: number;
  brand?: string;
  model?: string;
  condition?: string[];
  features?: string[];
  is_promoted?: boolean;
  business_tier?: BusinessTier;
}

export interface SearchResult {
  listings: Listing[];
  totalResults: number;
  filters: SearchFilters;
}

// ============================================
// 14. UPLOAD & ANALYSIS
// ============================================

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadState {
  isUploading: boolean;
  progress: UploadProgress;
  error?: string;
  videoId?: string;
}

export interface AnalysisRequest {
  videoFrames: string[];
  metadata?: {
    videoUrl?: string;
    duration?: number;
    width?: number;
    height?: number;
    userId?: string;
  };
}

export interface AnalysisStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep?: string;
  result?: Partial<Listing>;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

// ============================================
// 15. AUTHENTICATION
// ============================================

export interface AuthToken {
  id: string;
  phone: string;
  role: string;
  business_id?: string;
  iat: number;
  exp: number;
}

export interface VerificationCode {
  id: string;
  phone: string;
  code: string;
  expires_at: string;
  created_at: string;
  is_used: boolean;
  ip_address?: string;
  attempts: number;
}

// ============================================
// 16. ERROR HANDLING
// ============================================

export interface ApiError {
  success: false;
  error: string;
  code: string;
  details?: any;
  requestId?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// ============================================
// 17. THEME & UI
// ============================================

export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
}

// ============================================
// 18. NAVIGATION TYPES
// ============================================

export type RootStackParamList = {
  '(tabs)': undefined;
  '(auth)': undefined;
  '(onboarding)': undefined;
  '(business)': undefined;
  'car/[id]': { id: string };
  'profile/[id]': { id: string };
  'chat/[conversationId]': { conversationId: string };
  'listing/[id]': { id: string };
  '+not-found': undefined;
};

export type TabParamList = {
  index: undefined;
  search: undefined;
  upload: undefined;
  messages: undefined;
  profile: undefined;
};

// ============================================
// EXPORT ALL TYPES
// ============================================

// All types are already exported above

