// ============================================
// Listing Types
// ============================================

import type { ListingCategory } from '../constants/categories';
import type { ListingStatus, VideoStatus } from '../constants/statuses';

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
  property_type: 'apartment' | 'house' | 'land' | 'commercial';
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

export interface FeedItem extends Listing {
  video_url?: string;
  thumbnail_url?: string;
  is_liked?: boolean;
  is_saved?: boolean;
}

export interface SearchResult extends Listing {
  relevance_score?: number;
}

