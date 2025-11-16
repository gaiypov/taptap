// Типы для BOOST монетизации

export type BoostType = '3h' | '24h' | '7d' | '30d';
export type PaymentMethod = 'mbank' | 'bakai' | 'obank' | 'optima';
export type TransactionStatus = 'pending' | 'processing' | 'success' | 'failed' | 'cancelled' | 'refunded';

export interface BoostPlan {
  id: BoostType;
  name: string;
  emoji: string;
  price: number;
  duration: number; // в часах
  features: string[];
  multiplier: number;
  color: string;
  gradient: [string, string];
}

export interface BoostTransaction {
  id: string;
  car_id: string;
  user_id: string;
  boost_type: BoostType;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  payment_id?: string;
  payment_url?: string;
  status: TransactionStatus;
  activated_at?: string;
  expires_at?: string;
  duration_hours: number;
  views_before: number;
  views_during: number;
  views_after: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PaymentRequest {
  amount: number;
  currency?: string;
  description: string;
  return_url?: string;
  webhook_url?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  payment_id?: string;
  payment_url?: string;
  status: TransactionStatus;
  message?: string;
  error?: string;
}

export interface PaymentStatus {
  payment_id: string;
  status: TransactionStatus;
  amount?: number;
  currency?: string;
  paid_at?: string;
  metadata?: Record<string, any>;
}

export interface WebhookLog {
  id: string;
  source: PaymentMethod;
  event: string;
  payment_id?: string;
  headers?: Record<string, any>;
  body?: Record<string, any>;
  response?: Record<string, any>;
  ip_address?: string;
  success: boolean;
  error?: string;
  created_at: string;
}

export interface ActiveBoost {
  car_id: string;
  type: BoostType;
  activated_at: string;
  expires_at: string;
  hours_remaining: number;
  views_before: number;
  current_views: number;
}

export interface BoostStats {
  total_spent: number;
  total_boosts: number;
  avg_multiplier: number;
  recent_boosts: BoostTransaction[];
}
