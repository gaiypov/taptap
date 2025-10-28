import type { ListingCategory } from '../constants/categories';
import type { ListingStatus, VideoStatus } from '../constants/statuses';
export interface BaseListing {
    id: string;
    seller_user_id: string | null;
    business_id: string | null;
    category: ListingCategory;
    title: string;
    description: string;
    price: number;
    currency: string;
    location_text: string;
    latitude: number | null;
    longitude: number | null;
    video_id: string | null;
    video_status: VideoStatus;
    status: ListingStatus;
    is_boosted: boolean;
    created_at: string;
    updated_at: string;
}
export interface CarDetails {
    make: string;
    model: string;
    year: number;
    mileage_km: number;
    vin?: string;
    damage_report?: string;
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
    is_owner?: boolean;
}
export interface Listing extends BaseListing {
    seller?: {
        id: string;
        name: string;
        phone: string;
        avatar_url?: string;
    };
    business?: {
        id: string;
        name: string;
        verified: boolean;
        phone_public?: string;
    };
    car_details?: CarDetails;
    horse_details?: HorseDetails;
    real_estate_details?: RealEstateDetails;
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
//# sourceMappingURL=listing.types.d.ts.map