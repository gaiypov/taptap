// ============================================
// Backend-Specific Types
// ============================================

// Types that are ONLY used in the backend (not shared with mobile)

export interface VerificationCode {
  id: string;
  phone: string;
  code: string;
  expires_at: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

