// ============================================
// Validation Utilities
// ============================================

import { z } from 'zod';

// Phone validation
export const phoneSchema = z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number');

// Email validation
export const emailSchema = z.string().email('Invalid email address');

// JWT validation schema
export const jwtSchema = z.object({
  userId: z.string().uuid(),
  role: z.string(),
  phone: z.string(),
  iat: z.number(),
  exp: z.number()
});

// Create listing validation
export const createListingSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000),
  category: z.enum(['car', 'horse', 'real_estate']),
  price: z.number().min(0),
  currency: z.enum(['KGS', 'USD']),
  location: z.string().min(2),
  video_url: z.string().url().optional(),
  video_id: z.string().optional(),
  additional_photos: z.array(z.string().url()).optional(),
  metadata: z.record(z.any()).optional()
});

// Update listing validation
export const updateListingSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(2000).optional(),
  price: z.number().min(0).optional(),
  currency: z.enum(['KGS', 'USD']).optional(),
  location: z.string().min(2).optional(),
  video_url: z.string().url().optional(),
  additional_photos: z.array(z.string().url()).optional(),
  metadata: z.record(z.any()).optional()
});

export default {
  phoneSchema,
  emailSchema,
  jwtSchema,
  createListingSchema,
  updateListingSchema
};

