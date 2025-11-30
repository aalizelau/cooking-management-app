-- Add expiry tracking columns to ingredients table
ALTER TABLE public.ingredients 
ADD COLUMN IF NOT EXISTS storage_tips TEXT,
ADD COLUMN IF NOT EXISTS shelf_life_days INTEGER,
ADD COLUMN IF NOT EXISTS bought_date DATE;
