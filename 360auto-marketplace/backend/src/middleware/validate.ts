// ============================================
// 360⁰ Marketplace - Validation Middleware
// Production Ready for Kyrgyzstan Launch
// ============================================

import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          details: error.errors
        });
      }
      next(error);
    }
  };
}

export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          details: error.errors
        });
      }
      next(error);
    }
  };
}

export function validateParams(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          details: error.errors
        });
      }
      next(error);
    }
  };
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

// Auth schemas
export const requestSmsCodeSchema = z.object({
  phone: z.string().regex(/^\+996[0-9]{9}$/, 'Invalid Kyrgyzstan phone number format')
});

export const verifySmsCodeSchema = z.object({
  phone: z.string().regex(/^\+996[0-9]{9}$/, 'Invalid Kyrgyzstan phone number format'),
  code: z.string().regex(/^[0-9]{6}$/, 'Code must be 6 digits'),
  name: z.string().min(2).max(100),
  age: z.number().min(18).max(120),
  consent_offer_agreement: z.boolean().refine(val => val === true, 'Offer agreement must be accepted'),
  consent_personal_data_processing: z.boolean().refine(val => val === true, 'Personal data processing consent must be accepted')
});

// Listing schemas
export const createListingSchema = z.object({
  category: z.enum(['car', 'horse', 'real_estate']),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  price: z.number().positive(),
  currency: z.string().min(1).max(5).default('KZT'),
  location_text: z.string().min(2).max(200),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  carDetails: z.object({
    make: z.string().min(1).max(100),
    model: z.string().min(1).max(100),
    year: z.number().min(1900).max(new Date().getFullYear() + 1),
    mileage_km: z.number().min(0),
    vin: z.string().optional()
  }).optional(),
  horseDetails: z.object({
    breed: z.string().min(1).max(100),
    age_years: z.number().min(0).max(50),
    gender: z.enum(['stallion', 'mare', 'gelding']).optional(),
    training_level: z.string().optional(),
    health_notes: z.string().optional()
  }).optional(),
  realEstateDetails: z.object({
    property_type: z.enum(['apartment', 'house', 'land', 'commercial']),
    rooms: z.number().min(0).optional(),
    area_m2: z.number().positive().optional(),
    address_text: z.string().optional(),
    is_owner: z.boolean().optional()
  }).optional()
}).refine(data => {
  // Ensure category-specific details are provided
  if (data.category === 'car' && !data.carDetails) return false;
  if (data.category === 'horse' && !data.horseDetails) return false;
  if (data.category === 'real_estate' && !data.realEstateDetails) return false;
  return true;
}, 'Category-specific details are required');

export const updateListingSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  price: z.number().positive().optional(),
  currency: z.string().min(1).max(5).optional(),
  location_text: z.string().min(2).max(200).optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  carDetails: z.object({
    make: z.string().min(1).max(100).optional(),
    model: z.string().min(1).max(100).optional(),
    year: z.number().min(1900).max(new Date().getFullYear() + 1).optional(),
    mileage_km: z.number().min(0).optional(),
    vin: z.string().optional()
  }).optional(),
  horseDetails: z.object({
    breed: z.string().min(1).max(100).optional(),
    age_years: z.number().min(0).max(50).optional(),
    gender: z.enum(['stallion', 'mare', 'gelding']).optional(),
    training_level: z.string().optional(),
    health_notes: z.string().optional()
  }).optional(),
  realEstateDetails: z.object({
    property_type: z.enum(['apartment', 'house', 'land', 'commercial']).optional(),
    rooms: z.number().min(0).optional(),
    area_m2: z.number().positive().optional(),
    address_text: z.string().optional(),
    is_owner: z.boolean().optional()
  }).optional()
});

// Business account schemas
export const createBusinessAccountSchema = z.object({
  name: z.string().min(2).max(255),
  tax_id: z.string().optional(),
  phone_public: z.string().regex(/^\+996[0-9]{9}$/, 'Invalid Kyrgyzstan phone number format').optional()
});

export const addBusinessMemberSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['admin', 'seller'])
});

// Chat schemas
export const createChatThreadSchema = z.object({
  listing_id: z.string().uuid()
});

export const sendMessageSchema = z.object({
  body: z.string().min(1).max(2000)
});

// Promotion schemas
export const startPromotionSchema = z.object({
  listing_id: z.string().uuid(),
  duration_days: z.number().min(1).max(30)
});

// Search schemas
export const searchListingsSchema = z.object({
  category: z.enum(['car', 'horse', 'real_estate']).optional(),
  searchQuery: z.string().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  location: z.string().optional(),
  sortBy: z.enum(['newest', 'price_asc', 'price_desc', 'popular']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  
  // Car-specific filters
  carMake: z.string().optional(),
  carModel: z.string().optional(),
  carYear: z.number().optional(),
  carMinYear: z.number().optional(),
  carMaxYear: z.number().optional(),
  carMinMileage: z.number().optional(),
  carMaxMileage: z.number().optional(),
  
  // Horse-specific filters
  horseBreed: z.string().optional(),
  horseMinAge: z.number().optional(),
  horseMaxAge: z.number().optional(),
  horseGender: z.string().optional(),
  
  // Real estate-specific filters
  propertyType: z.enum(['apartment', 'house', 'land', 'commercial']).optional(),
  minRooms: z.number().optional(),
  maxRooms: z.number().optional(),
  minArea: z.number().optional(),
  maxArea: z.number().optional()
});

// Moderation schemas
export const approveListingSchema = z.object({
  listing_id: z.string().uuid()
});

export const rejectListingSchema = z.object({
  listing_id: z.string().uuid(),
  reason: z.string().min(10).max(1000)
});

// Utility functions
export function sanitizeInput(data: any): any {
  if (typeof data === 'string') {
    return data.trim();
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return data;
}
