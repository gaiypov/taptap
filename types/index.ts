// ============================================
// 360⁰ Marketplace - Unified Types
// Production Ready for Kyrgyzstan Launch
// ============================================

// ============================================
// CORE TYPES
// ============================================

export type ListingCategory = 'car' | 'horse' | 'real_estate';

export type ListingStatus = 'pending_review' | 'active' | 'rejected' | 'archived';

export type VideoStatus = 'uploading' | 'processing' | 'ready' | 'failed';

export type PaymentStatus = 'pending' | 'paid' | 'failed';

export type ModerationAction = 'auto_flag' | 'approve' | 'reject';

export type BusinessMemberRole = 'admin' | 'seller';

export type PropertyType = 'apartment' | 'house' | 'land' | 'commercial';

// ============================================
// USER & AUTH TYPES
// ============================================

export interface User {
  id: string;
  phone: string;
  name: string;
  age?: number;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthToken {
  userId: string;
  role: string;
  phone: string;
  iat: number;
  exp: number;
}

// ============================================
// BUSINESS ACCOUNT TYPES
// ============================================

export interface BusinessAccount {
  id: string;
  name: string;
  tax_id?: string; // ИНН for Kyrgyzstan entities
  avatar_url?: string;
  verified: boolean;
  phone_public?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessMember {
  business_id: string;
  user_id: string;
  role: BusinessMemberRole;
  created_at: string;
}

// ============================================
// LISTING TYPES
// ============================================

export interface BaseListing {
  id: string;
  seller_user_id: string | null;   // for private seller
  business_id: string | null;      // for business accounts
  category: ListingCategory;
  title: string;
  description: string;
  price: number;
  currency: string;
  location_text: string;
  latitude: number | null;
  longitude: number | null;
  video_id: string | null;         // api.video reference
  video_status: VideoStatus;
  status: ListingStatus;
  is_boosted: boolean;             // derived from promotions
  created_at: string;
  updated_at: string;
}

export interface CarDetails {
  make: string;
  model: string;
  year: number;
  mileage_km: number;
  vin?: string;
  damage_report?: string;  // AI output
}

export interface HorseDetails {
  breed: string;
  age_years: number;
  gender?: string;
  training_level?: string;
  health_notes?: string;
}

export interface RealEstateDetails {
  property_type: PropertyType;
  rooms?: number;
  area_m2?: number;
  address_text?: string;
  is_owner?: boolean; // is owner or agent
}

export interface Listing extends BaseListing {
  // Seller info
  seller?: {
    id: string;
    name: string;
    phone: string;
    avatar_url?: string;
  };
  
  // Business info
  business?: {
    id: string;
    name: string;
    verified: boolean;
    phone_public?: string;
  };
  
  // Category-specific details
  car_details?: CarDetails;
  horse_details?: HorseDetails;
  real_estate_details?: RealEstateDetails;
  
  // Stats
  views_count: number;
  likes_count: number;
  comments_count: number;
  messages_count: number;
}

// ============================================
// CHAT TYPES
// ============================================

export interface ChatThread {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  created_at: string;
  
  // Related data
  listing?: {
    id: string;
    title: string;
    price: number;
    currency: string;
    thumbnail_url?: string;
  };
  
  buyer?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  
  seller?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  
  unread_count: number;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
  
  // Sender info
  sender?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

// ============================================
// PROMOTION TYPES
// ============================================

export interface Promotion {
  id: string;
  listing_id: string;
  started_at: string;
  ends_at: string;
  payment_status: PaymentStatus;
  created_at: string;
  
  // Related data
  listing?: {
    id: string;
    title: string;
    price: number;
    currency: string;
  };
}

// ============================================
// MODERATION TYPES
// ============================================

export interface ModerationEvent {
  id: string;
  listing_id: string;
  moderator_id: string | null; // null = auto AI flag
  action: ModerationAction;
  reason: string;
  created_at: string;
  
  // Related data
  listing?: {
    id: string;
    title: string;
    category: ListingCategory;
  };
  
  moderator?: {
    id: string;
    name: string;
  };
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  error: string;
  details?: any;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface CreateListingRequest {
  category: ListingCategory;
  title: string;
  description: string;
  price: number;
  currency: string;
  location_text: string;
  latitude?: number;
  longitude?: number;
  carDetails?: CarDetails;
  horseDetails?: HorseDetails;
  realEstateDetails?: RealEstateDetails;
}

export interface UpdateListingRequest {
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  location_text?: string;
  latitude?: number;
  longitude?: number;
  carDetails?: Partial<CarDetails>;
  horseDetails?: Partial<HorseDetails>;
  realEstateDetails?: Partial<RealEstateDetails>;
}

export interface CreateBusinessAccountRequest {
  name: string;
  tax_id?: string;
  phone_public?: string;
}

export interface AddBusinessMemberRequest {
  user_id: string;
  role: BusinessMemberRole;
}

export interface SendMessageRequest {
  body: string;
}

export interface StartPromotionRequest {
  listing_id: string;
  duration_days: number;
}

// ============================================
// SEARCH & FILTER TYPES
// ============================================

export interface SearchFilters {
  category?: ListingCategory;
  searchQuery?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'popular';
  page?: number;
  limit?: number;
  
  // Car-specific filters
  carMake?: string;
  carModel?: string;
  carYear?: number;
  carMinYear?: number;
  carMaxYear?: number;
  carMinMileage?: number;
  carMaxMileage?: number;
  
  // Horse-specific filters
  horseBreed?: string;
  horseMinAge?: number;
  horseMaxAge?: number;
  horseGender?: string;
  
  // Real estate-specific filters
  propertyType?: PropertyType;
  minRooms?: number;
  maxRooms?: number;
  minArea?: number;
  maxArea?: number;
}

export interface SearchResult extends Listing {
  relevance_score?: number;
}

// ============================================
// MOBILE APP TYPES
// ============================================

export interface FeedItem extends Listing {
  video_url?: string;
  thumbnail_url?: string;
  is_liked?: boolean;
  is_saved?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface AppState {
  auth: AuthState;
  feed: {
    items: FeedItem[];
    loading: boolean;
    refreshing: boolean;
    category: ListingCategory;
  };
  filters: SearchFilters;
  offlineDrafts: CreateListingRequest[];
}

// ============================================
// LEGAL COMPLIANCE TYPES
// ============================================

export interface LegalConsent {
  offer_agreement: boolean;
  personal_data_processing: boolean;
  marketing_communications?: boolean;
  created_at: string;
}

export interface UserConsent {
  user_id: string;
  consent_type: 'offer_agreement' | 'personal_data_processing' | 'marketing_communications';
  granted: boolean;
  granted_at: string;
  ip_address?: string;
  user_agent?: string;
}

// ============================================
// AUDIT & LOGGING TYPES
// ============================================

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string;
  details: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'chat_message' | 'listing_approved' | 'listing_rejected' | 'promotion_expired';
  data?: any;
  read_at: string | null;
  created_at: string;
}

export interface PushNotification {
  userId: string;
  title: string;
  body: string;
  data?: any;
}

// ============================================
// EXPORT ALL TYPES
// ============================================

export type {
    AddBusinessMemberRequest, ApiError, ApiResponse, AppState, AuditLog, AuthState, AuthToken, BaseListing, BusinessAccount,
    BusinessMember, BusinessMemberRole, CarDetails, ChatMessage, ChatThread, CreateBusinessAccountRequest, CreateListingRequest, FeedItem, HorseDetails, LegalConsent, Listing, ListingCategory,
    ListingStatus, ModerationAction, ModerationEvent, Notification, PaginatedResponse, PaymentStatus, Promotion, PropertyType, PushNotification, RealEstateDetails, SearchFilters,
    SearchResult, SendMessageRequest,
    StartPromotionRequest, UpdateListingRequest, User, UserConsent, VideoStatus
};
