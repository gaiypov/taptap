// backend/middleware/validation.ts
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS
// ============================================

// User schemas
export const createUserSchema = z.object({
  phone: z.string().min(10).max(20),
  name: z.string().min(1).max(255),
  avatar_url: z.string().url().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  avatar_url: z.string().url().optional(),
});

// Business account schemas
export const createBusinessAccountSchema = z.object({
  company_name: z.string().min(1).max(255),
  company_logo_url: z.string().url().optional(),
  company_description: z.string().max(1000).optional(),
  company_address: z.string().max(500).optional(),
  company_phone: z.string().min(10).max(20),
  company_email: z.string().email(),
  company_website: z.string().url().optional(),
  business_type: z.string().min(1).max(100),
  working_hours: z.record(z.object({
    from: z.string(),
    to: z.string(),
  })).optional(),
});

export const updateBusinessAccountSchema = createBusinessAccountSchema.partial();

// Team member schemas
export const inviteTeamMemberSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['admin', 'manager']),
});

export const updateTeamMemberSchema = z.object({
  role: z.enum(['admin', 'manager']),
});

// Listing schemas
export const createListingSchema = z.object({
  category: z.enum(['car', 'horse', 'real_estate']),
  business_id: z.string().uuid().optional(),
  video_id: z.string().min(1),
  video_url: z.string().url(),
  thumbnail_url: z.string().url().optional(),
  additional_images: z.array(z.string().url()).optional(),
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  price: z.number().positive(),
  currency: z.string().length(3).default('KGS'),
  city: z.string().max(100).optional(),
  location: z.string().max(255).optional(),
  details: z.record(z.any()), // Category-specific details
});

export const updateListingSchema = createListingSchema.partial().omit({ category: true });

// Car details schema
export const carDetailsSchema = z.object({
  brand: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  mileage: z.number().int().min(0),
  transmission: z.enum(['manual', 'automatic', 'cvt']).optional(),
  fuel_type: z.enum(['gasoline', 'diesel', 'electric', 'hybrid']).optional(),
  color: z.string().max(50).optional(),
  body_type: z.string().max(50).optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  vin: z.string().max(17).optional(),
  license_plate: z.string().max(20).optional(),
  owners_count: z.number().int().min(1).optional(),
  additional_images: z.array(z.string().url()).optional(),
});

// Horse details schema
export const horseDetailsSchema = z.object({
  breed: z.string().min(1).max(100),
  age: z.number().int().min(0).max(50),
  gender: z.enum(['stallion', 'mare', 'gelding']),
  color: z.string().min(1).max(50),
  height: z.number().int().min(50).max(300), // cm
  training: z.enum(['trained', 'untrained', 'partial']),
  purpose: z.enum(['racing', 'riding', 'breeding', 'sport', 'other']),
  pedigree: z.boolean(),
  health_certificate: z.boolean(),
  temperament: z.string().max(200).optional(),
  vaccinations: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
});

// Real estate details schema
export const realEstateDetailsSchema = z.object({
  property_type: z.enum(['apartment', 'house', 'commercial', 'land']),
  rooms: z.number().int().min(1).max(20).optional(),
  area: z.number().positive(),
  floor: z.number().int().min(1).optional(),
  total_floors: z.number().int().min(1).optional(),
  year_built: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']),
  features: z.array(z.string()).optional(),
  utilities: z.array(z.string()).optional(),
  parking: z.boolean().optional(),
  balcony: z.boolean().optional(),
  garden: z.boolean().optional(),
});

// Chat schemas
export const createChatThreadSchema = z.object({
  listing_id: z.string().uuid(),
});

export const sendMessageSchema = z.object({
  message: z.string().min(1).max(1000),
  message_type: z.enum(['text', 'image', 'offer']).default('text'),
  offer_amount: z.number().positive().optional(),
});

// Promotion schemas
export const createPromotionSchema = z.object({
  listing_id: z.string().uuid(),
  boost_type: z.enum(['basic', 'top', 'premium']),
  duration_days: z.number().int().min(1).max(30),
});

// Search schemas
export const searchListingsSchema = z.object({
  category: z.enum(['car', 'horse', 'real_estate']).optional(),
  status: z.enum(['active', 'sold', 'archived']).default('active'),
  priceMin: z.number().positive().optional(),
  priceMax: z.number().positive().optional(),
  location: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  yearMin: z.number().int().min(1900).optional(),
  yearMax: z.number().int().max(new Date().getFullYear() + 1).optional(),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  condition: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  is_promoted: z.boolean().optional(),
  business_tier: z.enum(['free', 'lite', 'business', 'pro']).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sort_by: z.enum(['created_at', 'price', 'views', 'likes']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// ============================================
// VALIDATION MIDDLEWARE
// ============================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationRequest extends Request {
  validatedData?: any;
}

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: ValidationRequest, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors: ValidationError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationErrors,
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Internal validation error',
        code: 'INTERNAL_ERROR',
      });
    }
  };
}

export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: ValidationRequest, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.query);
      req.validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors: ValidationError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        return res.status(400).json({
          success: false,
          error: 'Query validation failed',
          code: 'QUERY_VALIDATION_ERROR',
          details: validationErrors,
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Internal validation error',
        code: 'INTERNAL_ERROR',
      });
    }
  };
}

export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (req: ValidationRequest, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.params);
      req.validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors: ValidationError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

    return res.status(400).json({
      success: false,
          error: 'Parameter validation failed',
          code: 'PARAM_VALIDATION_ERROR',
          details: validationErrors,
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Internal validation error',
        code: 'INTERNAL_ERROR',
      });
    }
  };
}

// ============================================
// SPECIFIC VALIDATION MIDDLEWARES
// ============================================

// Video frames validation
export const validateVideoFrames = (req: Request, res: Response, next: NextFunction) => {
  const { videoFrames } = req.body;

  if (!videoFrames || !Array.isArray(videoFrames)) {
    return res.status(400).json({
      success: false,
      error: 'Video frames must be provided as an array',
      code: 'INVALID_VIDEO_FRAMES',
    });
  }

  if (videoFrames.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'At least one video frame is required',
      code: 'EMPTY_VIDEO_FRAMES',
    });
  }

  if (videoFrames.length > 50) {
    return res.status(400).json({
      success: false,
      error: 'Maximum 50 video frames allowed',
      code: 'TOO_MANY_VIDEO_FRAMES',
    });
  }

  // Validate each frame is a valid base64 string
  for (let i = 0; i < videoFrames.length; i++) {
    const frame = videoFrames[i];
    if (typeof frame !== 'string' || !frame.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        error: `Invalid video frame format at index ${i}`,
        code: 'INVALID_FRAME_FORMAT',
      });
    }
  }

  next();
};

// UUID parameter validation
export const validateUUID = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const uuid = req.params[paramName];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuid || !uuidRegex.test(uuid)) {
    return res.status(400).json({
      success: false,
        error: `Invalid ${paramName} format`,
        code: 'INVALID_UUID',
    });
  }

  next();
  };
};

// Phone number validation
export const validatePhoneNumber = (req: Request, res: Response, next: NextFunction) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({
      success: false,
      error: 'Phone number is required',
      code: 'MISSING_PHONE',
    });
  }

  // Basic phone validation (can be enhanced)
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,20}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid phone number format',
      code: 'INVALID_PHONE_FORMAT',
    });
  }

  next();
};

// File upload validation
export const validateFileUpload = (maxSize: number = 50 * 1024 * 1024) => { // 50MB default
  return (req: Request, res: Response, next: NextFunction) => {
    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'File is required',
        code: 'MISSING_FILE',
      });
    }

    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`,
        code: 'FILE_TOO_LARGE',
      });
    }

    next();
  };
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input.trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

export function validateBusinessTierLimits(
  tier: string,
  currentCount: number,
  maxCount: number | 'unlimited'
): boolean {
  if (maxCount === 'unlimited') {
    return true;
  }
  
  return currentCount < maxCount;
}

export function validateListingDetails(
  category: string,
  details: any
): { isValid: boolean; error?: string } {
  try {
    switch (category) {
      case 'car':
        carDetailsSchema.parse(details);
        break;
      case 'horse':
        horseDetailsSchema.parse(details);
        break;
      case 'real_estate':
        realEstateDetailsSchema.parse(details);
        break;
      default:
        return { isValid: false, error: 'Invalid category' };
    }
    
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        isValid: false, 
        error: `Invalid ${category} details: ${error.errors[0].message}` 
      };
    }
    
    return { isValid: false, error: 'Invalid details format' };
  }
}

// ============================================
// EXPORT SCHEMAS FOR REUSE
// ============================================

// All schemas are already exported above
