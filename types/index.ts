// ============================================================
// 360° Marketplace – Unified Domain Model
// ============================================================
// Этот файл консолидации типов используется во всём приложении
// (мобильный клиент, сервисы, интеграции) и должен оставаться
// единственным источником правды для бизнес‑сущностей.

// ------------------------------------------------------------
// Core enums
// ------------------------------------------------------------

export type ListingCategory = 'car' | 'horse' | 'real_estate';

export type ListingStatus =
  | 'draft'
  | 'pending_review'
  | 'active'
  | 'sold'
  | 'rejected'
  | 'archived'
  | 'expired';

export type VideoStatus = 'uploading' | 'processing' | 'ready' | 'failed';

export type PaymentStatus = 'pending' | 'paid' | 'failed';

export type ModerationAction = 'auto_flag' | 'approve' | 'reject';

export type BusinessMemberRole = 'owner' | 'admin' | 'manager' | 'seller';

export type PropertyType = 'apartment' | 'house' | 'commercial' | 'land';

export type MediaType = 'image' | 'video' | 'thumbnail' | 'document';

// ------------------------------------------------------------
// Shared entities
// ------------------------------------------------------------

export interface MediaAsset {
  id?: string;
  type: MediaType;
  url: string;
  preview_url?: string;
  width?: number;
  height?: number;
  duration?: number;
  order?: number;
  metadata?: Record<string, unknown>;
}

export interface Damage {
  type: string;
  severity: 'minor' | 'moderate' | 'major' | 'severe' | 'critical';
  location: string;
  confidence: number;
  description?: string;
}

// ------------------------------------------------------------
// User / Profile
// ------------------------------------------------------------

export interface User {
  id: string;
  phone: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  is_verified?: boolean;
  rating?: number;
  total_sales?: number;
  total_purchases?: number;
  response_rate?: number;
  last_login_at?: string;
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

export interface BusinessAccount {
  id: string;
  owner_id?: string;
  name: string;
  tax_id?: string;
  phone_public?: string;
  email?: string;
  website?: string;
  avatar_url?: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessMember {
  business_id: string;
  user_id: string;
  role: BusinessMemberRole;
  invited_at?: string;
  accepted_at?: string;
}

export interface ProfileStats {
  active_listings: number;
  sold_listings: number;
  total_views: number;
  total_followers?: number;
  response_rate?: number;
  rating?: number;
}

export interface Profile {
  user: User;
  business?: BusinessAccount | null;
  stats: ProfileStats;
  listings?: Listing[];
  saved_listings?: Listing[];
  media?: MediaAsset[];
  about?: string;
  is_current_user?: boolean;
}

// ------------------------------------------------------------
// Listing details per domain
// ------------------------------------------------------------

export interface CarDetails {
  brand: string;
  model: string;
  year: number;
  mileage: number;
  mileage_unit?: 'km' | 'mi';
  transmission?: 'manual' | 'automatic' | 'cvt' | 'robotic' | string;
  fuel_type?: 'gasoline' | 'diesel' | 'electric' | 'hybrid' | string;
  body_type?: string;
  drivetrain?: string;
  color?: string;
  owners_count?: number;
  vin?: string;
  license_plate?: string;
  engine?: {
    type?: string;
    capacity_l?: number;
    power_hp?: number;
  };
  condition?: 'excellent' | 'good' | 'fair' | 'poor' | string;
  damages?: Damage[];
  features?: string[];
  ai_summary?: string;
}

export interface HorseDetails {
  breed: string;
  age: number;
  gender?: 'stallion' | 'mare' | 'gelding' | string;
  color?: string;
  height?: number;
  temperament?: string;
  training?: string;
  purpose?: string;
  pedigree?: boolean;
  health_certificate?: boolean;
  vaccinations?: string[];
  achievements?: string[];
  issues?: string[];
  health_notes?: string;
}

export interface RealEstateDetails {
  property_type: PropertyType;
  area: number;
  area_unit?: 'm2' | 'ft2';
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  floor?: number;
  total_floors?: number;
  year_built?: number;
  condition?: 'excellent' | 'good' | 'fair' | 'poor' | string;
  address?: string;
  city?: string;
  description?: string;
  amenities?: string[];
  utilities?: string[];
  parking?: boolean;
  lot_area?: number;
}

export type ListingDetailsMap = {
  car: CarDetails;
  horse: HorseDetails;
  real_estate: RealEstateDetails;
};

export type ListingDetails = ListingDetailsMap[ListingCategory];

export interface SellerSummary {
  id: string;
  name?: string;
  avatar_url?: string;
  phone?: string;
  is_verified?: boolean;
  rating?: number;
  total_sales?: number;
  response_rate?: number;
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface CarAIAnalysis {
  condition: 'excellent' | 'good' | 'fair' | 'poor' | string;
  conditionScore: number;
  damages: Damage[];
  estimatedPrice: PriceRange;
  features: string[];
  summary?: string;
}

export interface HorseAIAnalysis {
  is_horse: boolean;
  confidence: number;
  breed?: string;
  color?: string;
  estimated_age?: 'young' | 'adult' | 'old' | string;
  estimated_height?: number;
  visible_defects?: string[];
  quality_score?: number;
  tags?: string[];
  issues?: string[];
  temperament?: string;
  condition?: 'excellent' | 'good' | 'fair' | 'poor' | string;
  body_condition_score?: number;
  conformation?: string;
  reason?: string;
}

// ------------------------------------------------------------
// Listing aggregate
// ------------------------------------------------------------

export interface Listing {
  id: string;
  category: ListingCategory;
  seller_id: string;
  seller?: SellerSummary;
  business_id?: string | null;

  title: string;
  description?: string;
  price: number;
  currency: string;
  city?: string;
  location?: string;

  video_id: string;
  video_url: string;
  videoUrl?: string;
  thumbnail_url?: string;
  thumbnailUrl?: string;
  media?: MediaAsset[];

  status: ListingStatus;
  created_at: string;
  updated_at: string;
  createdAt?: string;
  updatedAt?: string;
  published_at?: string;
  publishedAt?: string;
  sold_at?: string;
  soldAt?: string;
  expires_at?: string;
  expiresAt?: string;
  delete_at?: string;
  deleteAt?: string;

  views: number;
  likes: number;
  saves: number;
  shares: number;
  messages_count: number;
  comments_count?: number;

  // Compatibility aliases for legacy code
  views_count?: number;
  likes_count?: number;
  saves_count?: number;

  details: ListingDetails;

  ai_score?: number;
  ai_condition?: 'excellent' | 'good' | 'fair' | 'poor' | string;
  ai_damages?: Damage[];
  ai_features?: string[];
  ai_tags?: string[];
  ai_analysis_text?: string;
  ai_estimated_price?: {
    min: number;
    max: number;
  };
  aiAnalysis?: CarAIAnalysis | HorseAIAnalysis | null;

  is_promoted?: boolean;
  boost_type?: 'basic' | 'top' | 'premium';
  boost_expires_at?: string;
  boost_activated_at?: string;
  views_before_boost?: number;

  // UI state flags (not persisted)
  isLiked?: boolean;
  isSaved?: boolean;
  is_liked?: boolean | any[];
  is_saved?: boolean | any[];
  is_verified?: boolean;
}

export type ListingByCategory<C extends ListingCategory> = Listing & {
  category: C;
  details: ListingDetailsMap[C];
};

export interface CarListing extends Listing {
  category: 'car';
  details: CarDetails;
  brand?: string;
  model?: string;
  year?: number;
  mileage?: number;
  color?: string;
  transmission?: string;
  aiAnalysis?: CarAIAnalysis | null;
}

export interface HorseListing extends Listing {
  category: 'horse';
  details: HorseDetails;
  aiAnalysis?: HorseAIAnalysis | null;
}

export interface RealEstateListing extends Listing {
  category: 'real_estate';
  details: RealEstateDetails;
}

// Backwards compatibility aliases
export type Car = CarListing;

export const isCarListing = (listing: Listing): listing is CarListing =>
  listing.category === 'car';

export const isHorseListing = (listing: Listing): listing is HorseListing =>
  listing.category === 'horse';

export const isRealEstateListing = (
  listing: Listing,
): listing is RealEstateListing => listing.category === 'real_estate';

// ------------------------------------------------------------
// Communications (chat / conversations)
// ------------------------------------------------------------

export interface ConversationUser {
  id: string;
  name?: string;
  avatar_url?: string;
  is_verified?: boolean;
  phone?: string;
}

export interface Conversation {
  id: string;
  listing_id: string;
  car_id?: string; // legacy alias
  buyer_id: string;
  seller_id: string;
  last_message?: string;
  last_message_at: string;
  unread_count?: number;
  created_at?: string;
  updated_at?: string;
  listing?: Listing;
  car?: CarListing; // legacy alias for UI components
  buyer?: ConversationUser;
  seller?: ConversationUser;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  message?: string; // legacy alias for body
  type: 'text' | 'image' | 'video' | 'system';
  created_at: string;
  updated_at?: string;
  is_read?: boolean;
  metadata?: Record<string, unknown>;
  attachments?: MediaAsset[];
  sender?: ConversationUser;
}

// Legacy alias to simplify gradual refactors
export type Message = ChatMessage;

// ------------------------------------------------------------
// Promotions / moderation / notifications
// ------------------------------------------------------------

export interface Promotion {
  id: string;
  listing_id: string;
  started_at: string;
  ends_at: string;
  payment_status: PaymentStatus;
  created_at: string;
  listing?: Listing;
}

export interface ModerationEvent {
  id: string;
  listing_id: string;
  moderator_id: string | null;
  action: ModerationAction;
  reason: string;
  created_at: string;
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

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'chat_message' | 'listing_approved' | 'listing_rejected' | 'promotion_expired';
  data?: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface PushNotification {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

// ------------------------------------------------------------
// API & DTO helpers
// ------------------------------------------------------------

export interface CreateListingRequest {
  category: ListingCategory;
  title: string;
  description?: string;
  price: number;
  currency: string;
  city?: string;
  location?: string;
  video_id: string;
  video_url: string;
  thumbnail_url?: string;
  details: ListingDetails;
}

export interface UpdateListingRequest {
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  city?: string;
  location?: string;
  video_id?: string;
  video_url?: string;
  thumbnail_url?: string;
  details?: Partial<ListingDetails>;
}

export interface CreateBusinessAccountRequest {
  name: string;
  tax_id?: string;
  phone_public?: string;
  email?: string;
}

export interface AddBusinessMemberRequest {
  user_id: string;
  role: BusinessMemberRole;
}

export interface SendMessageRequest {
  body: string;
  attachments?: MediaAsset[];
}

export interface StartPromotionRequest {
  listing_id: string;
  duration_days: number;
}

export interface SearchFilters {
  category?: ListingCategory;
  searchQuery?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  location?: string;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'popular';
  page?: number;
  limit?: number;

  // Car-specific filters
  brand?: string;
  model?: string;
  transmission?: string;

  // Horse-specific filters
  breed?: string;
  gender?: string;

  // Real estate
  propertyType?: PropertyType;
  minRooms?: number;
  maxRooms?: number;
  minArea?: number;
  maxArea?: number;
}

export interface SearchResult extends Listing {
  relevance_score?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
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
  details?: unknown;
}

// ------------------------------------------------------------
// App state helpers (Redux / Zustand compatible)
// ------------------------------------------------------------

export interface FeedItem extends Listing {
  position?: number;
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

// ------------------------------------------------------------
// Compliance & audit
// ------------------------------------------------------------

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

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string;
  details: unknown;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}
