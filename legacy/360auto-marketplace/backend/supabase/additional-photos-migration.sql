-- Migration: Add additional_photos column to listings table
-- Date: 2025-01-20

-- Add additional_photos column as text array
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS additional_photos TEXT[] DEFAULT '{}';

-- Add comment
COMMENT ON COLUMN listings.additional_photos IS 'Array of URLs for additional photos (up to 10 photos)';

-- Add index for array operations
CREATE INDEX IF NOT EXISTS idx_listings_additional_photos 
ON listings USING GIN (additional_photos);

-- Example of how to insert additional photos:
-- UPDATE listings 
-- SET additional_photos = ARRAY[
--   'https://cdn.360auto.kg/photos/abc123-1.jpg',
--   'https://cdn.360auto.kg/photos/abc123-2.jpg',
--   'https://cdn.360auto.kg/photos/abc123-3.jpg'
-- ] 
-- WHERE id = 'listing-id';

