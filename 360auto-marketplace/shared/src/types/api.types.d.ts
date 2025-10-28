export interface ApiResponse<T = any> {
    success: true;
    data: T;
}
export interface ApiErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: any;
    };
}
export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;
export interface PaginatedResponse<T> {
    success: true;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    };
}
export declare function isApiSuccess<T>(response: ApiResult<T>): response is ApiResponse<T>;
export declare function isApiError(response: ApiResult<any>): response is ApiErrorResponse;
export interface CreateListingRequest {
    category: 'car' | 'horse' | 'real_estate';
    title: string;
    description: string;
    price: number;
    currency: string;
    location_text: string;
    latitude?: number;
    longitude?: number;
    carDetails?: any;
    horseDetails?: any;
    realEstateDetails?: any;
}
export interface UpdateListingRequest {
    title?: string;
    description?: string;
    price?: number;
    currency?: string;
    location_text?: string;
    latitude?: number;
    longitude?: number;
}
export interface CreateBusinessAccountRequest {
    name: string;
    tax_id?: string;
    phone_public?: string;
}
export interface AddBusinessMemberRequest {
    user_id: string;
    role: 'admin' | 'seller';
}
export interface SendMessageRequest {
    body: string;
}
export interface StartPromotionRequest {
    listing_id: string;
    duration_days: number;
}
export interface SearchFilters {
    category?: 'car' | 'horse' | 'real_estate';
    searchQuery?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'popular';
    page?: number;
    limit?: number;
}
//# sourceMappingURL=api.types.d.ts.map