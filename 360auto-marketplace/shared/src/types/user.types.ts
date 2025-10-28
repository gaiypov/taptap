// ============================================
// User & Auth Types (Unified)
// ============================================

export interface User {
  // ID
  id: string;
  
  // Auth
  phone: string;
  phoneVerified: boolean;
  
  // Profile
  name: string;
  age?: number;
  avatarUrl?: string;
  city?: string;
  region?: string;
  
  // Stats
  listingsCount: number;
  rating: number;
  reviewsCount: number;
  totalSales: number;
  
  // Status
  isVerified: boolean;
  isBanned: boolean;
  
  // Timestamps (ISO 8601 strings)
  createdAt: string;
  updatedAt: string;
  lastActiveAt?: string;
}

export interface CreateUserRequest {
  phone: string;
  name?: string;
  age?: number;
}

export interface UpdateUserRequest {
  name?: string;
  age?: number;
  avatarUrl?: string;
  city?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  rating: number;
  isVerified: boolean;
}

export interface AuthToken {
  userId: string;
  role: string;
  phone: string;
  iat: number;
  exp: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

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
  role: 'admin' | 'seller';
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

export interface LegalConsent {
  offer_agreement: boolean;
  personal_data_processing: boolean;
  marketing_communications?: boolean;
  created_at: string;
}
